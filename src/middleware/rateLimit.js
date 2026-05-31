const rateLimit = require("express-rate-limit");
const { getRedis } = require("../utils/redis");
const logger = require("../utils/logger");

let store;
try {
  const redis = getRedis();
  if (redis) {
    const RedisStore = require("rate-limit-redis");
    store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: "rl:",
    });
    logger.info("rate-limit using Redis store");
  }
} catch (e) { logger.info("rate-limit-redis not installed — using memory store"); }

const baseOpts = { standardHeaders: true, legacyHeaders: false, ...(store ? { store } : {}) };

exports.apiLimiter = rateLimit({
  ...baseOpts,
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 120),
  message: { error: "Too many requests, please slow down." },
});

exports.authLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, try again later." },
});

exports.uploadLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many uploads, try again later." },
});

// Burst limiter for expensive AI calls
exports.aiLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "AI rate limit exceeded." },
});
