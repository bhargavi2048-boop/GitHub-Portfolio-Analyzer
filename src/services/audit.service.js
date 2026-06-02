const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

async function log({ userId, action, resource, req, metadata, status = "success" }) {
  try {
    await AuditLog.create({
      userId, action, resource, status,
      ip: req?.ip, userAgent: req?.headers?.["user-agent"],
      metadata,
    });
  } catch (e) {
    logger.warn("audit log failed", { msg: e.message });
  }
}

function middleware(action) {
  return (req, res, next) => {
    res.on("finish", () => {
      const status = res.statusCode >= 400 ? "failure" : "success";
      log({
        userId: req.user?.id || req.user?.sub,
        action, resource: req.originalUrl, req, status,
        metadata: { method: req.method, code: res.statusCode },
      });
    });
    next();
  };
}

module.exports = { log, middleware };
