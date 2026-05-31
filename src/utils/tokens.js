const jwt = require("jsonwebtoken");

const ACCESS_TTL = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}
function signRefresh(payload) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + ":refresh";
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TTL });
}
function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
function verifyRefresh(token) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + ":refresh";
  return jwt.verify(token, secret);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
