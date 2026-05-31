// Lightweight double-submit CSRF protection for cookie-authenticated state-changing requests.
// Skipped for Bearer-token (API) requests, GET/HEAD/OPTIONS, and webhook paths.
const crypto = require("crypto");

const COOKIE = "csrf_token";
const HEADER = "x-csrf-token";

function issueToken(_req, res, next) {
  if (!_req.cookies?.[COOKIE]) {
    const tok = crypto.randomBytes(24).toString("hex");
    res.cookie(COOKIE, tok, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  next();
}

function verify(req, res, next) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();
  // Bearer-token authed requests are CSRF-safe (no ambient credentials)
  if ((req.headers.authorization || "").startsWith("Bearer ")) return next();
  // Allow webhooks / public unauth endpoints
  if (req.path.startsWith("/api/public/webhooks")) return next();

  const cookieTok = req.cookies?.[COOKIE];
  const headerTok = req.headers[HEADER];
  if (!cookieTok || !headerTok || cookieTok !== headerTok) {
    return res.status(403).json({ error: "CSRF token mismatch" });
  }
  next();
}

module.exports = { issueToken, verify, COOKIE, HEADER };
