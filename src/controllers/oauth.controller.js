const crypto = require("crypto");
const User = require("../models/User");
const { issueTokens, publicUser } = require("./auth.controller");
const logger = require("../utils/logger");

const STATES = new Map();

function newState() {
  const s = crypto.randomBytes(16).toString("hex");
  STATES.set(s, Date.now() + 10 * 60 * 1000);
  return s;
}

function consumeState(s) {
  const exp = STATES.get(s);
  if (!exp) return false;
  STATES.delete(s);
  return exp > Date.now();
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of STATES) if (v < now) STATES.delete(k);
}, 5 * 60 * 1000).unref?.();

function getCallbackUrl(req) {
  if (process.env.GITHUB_CALLBACK_URL) return process.env.GITHUB_CALLBACK_URL;
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}/api/auth/github/callback`;
}

exports.start = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(501).send(`
      <html><body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px;">
        <h2>GitHub OAuth Not Configured</h2>
        <p>Add these to your <code>.env</code> file:</p>
        <pre style="background:#f5f5f5;padding:16px;border-radius:8px;">GITHUB_CLIENT_ID=your_client_id\nGITHUB_CLIENT_SECRET=your_client_secret\nGITHUB_CALLBACK_URL=${req.protocol}://${req.get("host")}/api/auth/github/callback</pre>
        <p><a href="/">← Back</a></p>
      </body></html>
    `);
  }
  const state = newState();
  const callback = getCallbackUrl(req);
  const url =
    `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(callback)}` +
    `&scope=${encodeURIComponent("read:user user:email")}` +
    `&state=${state}`;
  res.redirect(url);
};

exports.callback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect("/?oauth=denied");
    if (!code || !state || !consumeState(state)) return res.redirect("/?oauth=failed&reason=state");

    const callback = getCallbackUrl(req);
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: callback }),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) return res.redirect("/?oauth=failed&reason=token");

    const [profileRes, emailRes] = await Promise.all([
      fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json", "User-Agent": "GPA-App" } }),
      fetch("https://api.github.com/user/emails", { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json", "User-Agent": "GPA-App" } }),
    ]);
    const profile = await profileRes.json();
    if (!profile.id) return res.redirect("/?oauth=failed&reason=profile");

    const emails = emailRes.ok ? await emailRes.json() : [];
    const primaryEmail =
      (Array.isArray(emails) ? emails.find((e) => e.primary && e.verified)?.email : null) ||
      profile.email ||
      `${profile.id}+${profile.login}@users.noreply.github.com`;

    let user = await User.findOne({ githubId: String(profile.id) }) ||
               await User.findOne({ email: primaryEmail });

    if (!user) {
      user = await User.create({
        email: primaryEmail,
        githubId: String(profile.id),
        githubLogin: profile.login,
        name: profile.name || profile.login,
        avatarUrl: profile.avatar_url,
        emailVerified: true,
      });
      logger.info("New user via GitHub OAuth", { githubLogin: profile.login });
    } else {
      user.githubId = String(profile.id);
      user.githubLogin = profile.login;
      user.avatarUrl = profile.avatar_url;
      if (!user.name) user.name = profile.name || profile.login;
      user.emailVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const { access, refresh } = await issueTokens(user, req);
    const success = process.env.OAUTH_SUCCESS_REDIRECT || "/";
    const sep = success.includes("#") ? "&" : "#";
    res.redirect(`${success}${sep}token=${encodeURIComponent(access)}&refreshToken=${encodeURIComponent(refresh)}&user=${encodeURIComponent(JSON.stringify(publicUser(user)))}`);
  } catch (e) {
    logger.error("GitHub OAuth callback error", { err: e.message });
    next(e);
  }
};
