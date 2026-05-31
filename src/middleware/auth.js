const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.access_token) return req.cookies.access_token;
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token", code: e.name });
  }
}

function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); }
    catch { /* ignore */ }
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role].filter(Boolean);
    const allowed = roles.some((r) => userRoles.includes(r));
    if (!allowed) {
      logger.warn("forbidden access attempt", { user: req.user.sub || req.user.id, path: req.path, need: roles });
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole, extractToken };
