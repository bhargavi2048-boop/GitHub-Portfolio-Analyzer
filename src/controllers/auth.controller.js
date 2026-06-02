const crypto = require("crypto");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { signAccess, signRefresh, verifyRefresh } = require("../utils/tokens");
const { sendMail } = require("../utils/mailer");
const logger = require("../utils/logger");

const MAX_FAILED_LOGINS = parseInt(process.env.MAX_FAILED_LOGINS || "5");
const LOCKOUT_DURATION_MS = parseInt(process.env.LOCKOUT_DURATION_MS || String(15 * 60 * 1000));

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function issueTokens(user, req) {
  const access = signAccess({ id: user.id || user._id, email: user.email });
  const refresh = signRefresh({ id: user.id || user._id });
  await RefreshToken.create({
    user: user.id || user._id,
    tokenHash: sha256(refresh),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    userAgent: req?.headers?.["user-agent"]?.slice(0, 200),
    ip: req?.ip,
  });
  return { access, refresh };
}

function publicUser(u) {
  return {
    id: u.id || u._id,
    email: u.email,
    name: u.name,
    githubLogin: u.githubLogin,
    avatarUrl: u.avatarUrl,
    emailVerified: u.emailVerified,
  };
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required", code: "MISSING_FIELDS" });
    if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters", code: "WEAK_PASSWORD" });

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: "Email already in use", code: "EMAIL_TAKEN" });

    const verificationToken = crypto.randomBytes(24).toString("hex");
    const user = await User.create({
      email: normalizedEmail,
      password,
      name,
      emailVerificationToken: verificationToken,
    });

    try {
      sendMail({
        to: user.email,
        subject: "Verify your email",
        text: `Verify: ${process.env.APP_URL || ""}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`,
      }).catch((e) => logger.warn("verify-email send failed", { err: e.message }));
    } catch (e) {
      logger.warn("verify-email dispatch failed", { err: e.message });
    }

    const { access, refresh } = await issueTokens(user, req);
    res.cookie("access_token", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    return res.status(201).json({ token: access, refreshToken: refresh, user: publicUser(user) });
  } catch (e) {
    if (e?.code === "SQLITE_CONSTRAINT_UNIQUE" || e?.message?.includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already in use", code: "EMAIL_TAKEN" });
    }
    logger.error("register failed", { err: e.message });
    return next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required", code: "MISSING_FIELDS" });
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        error: `Account locked. Try again in ${minutesLeft} minute(s).`,
        code: "ACCOUNT_LOCKED",
        lockedUntil: user.lockedUntil,
      });
    }

    if (!user || !(await user.compare(password))) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
          user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          user.failedLoginAttempts = 0;
          logger.warn("account locked", { email: normalizedEmail, ip: req.ip });
        }
        await user.save();
      }
      return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const { access, refresh } = await issueTokens(user, req);
    res.cookie("access_token", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    return res.json({ token: access, refreshToken: refresh, user: publicUser(user) });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.body?.refreshToken || req.headers["x-refresh-token"];
    if (!token) return res.status(400).json({ error: "Missing refresh token", code: "MISSING_REFRESH_TOKEN" });
    let payload;
    try { payload = verifyRefresh(token); } catch { return res.status(401).json({ error: "Invalid refresh token", code: "INVALID_REFRESH_TOKEN" }); }
    const hash = sha256(token);
    const record = await RefreshToken.findOne({ tokenHash: hash, user: payload.id });
    if (!record) return res.status(401).json({ error: "Refresh token revoked", code: "REFRESH_TOKEN_REVOKED" });
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "User not found", code: "USER_NOT_FOUND" });

    record.revokedAt = new Date();
    await record.save();
    const { access, refresh } = await issueTokens(user, req);
    res.cookie("access_token", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.json({ token: access, refreshToken: refresh });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.body?.refreshToken || req.headers["x-refresh-token"];
    if (token) {
      const hash = sha256(token);
      await RefreshToken.updateOne({ tokenHash: hash }, { $set: { revokedAt: new Date() } });
    }
    res.clearCookie("access_token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.status(204).end();
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Not found", code: "USER_NOT_FOUND" });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: true });
    const token = crypto.randomBytes(24).toString("hex");
    user.passwordResetToken = sha256(token);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    sendMail({
      to: user.email,
      subject: "Reset your password",
      text: `Reset link (valid 1h): ${process.env.APP_URL || ""}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`,
    }).catch((e) => logger.warn("reset email failed", { err: e.message }));
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: "Password too short", code: "WEAK_PASSWORD" });
    const user = await User.findOne({ email });
    if (!user || !user.passwordResetToken || user.passwordResetToken !== sha256(token) || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired token", code: "INVALID_RESET_TOKEN" });
    }
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();
    await RefreshToken.updateMany({ user: user.id }, { $set: { revokedAt: new Date() } });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.query;
    const user = await User.findOne({ email });
    if (!user || !user.emailVerificationToken || user.emailVerificationToken !== sha256(String(token))) {
      return res.status(400).json({ error: "Invalid verification link", code: "INVALID_VERIFY_TOKEN" });
    }
    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.updateDigest = async (req, res, next) => {
  try {
    const { subscribe } = req.body;
    if (typeof subscribe !== "boolean") return res.status(400).json({ error: "subscribe must be boolean", code: "INVALID_PARAM" });
    await User.findByIdAndUpdate(req.user.id, { weeklyDigest: subscribe });
    res.json({ ok: true, weeklyDigest: subscribe });
  } catch (e) { next(e); }
};

exports.issueTokens = issueTokens;
exports.publicUser = publicUser;
