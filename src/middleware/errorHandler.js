const logger = require("../utils/logger");

module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const requestId = req.headers["x-request-id"] || res.getHeader("x-request-id");
  const payload = {
    error: err.message || "Internal server error",
    code: err.code || (status === 500 ? "INTERNAL_ERROR" : undefined),
    requestId,
  };
  logger.error("request_error", {
    method: req.method,
    url: req.originalUrl,
    status,
    requestId,
    msg: err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
  if (process.env.NODE_ENV !== "production" && err.stack) payload.stack = err.stack;
  res.status(status).json(payload);
};
