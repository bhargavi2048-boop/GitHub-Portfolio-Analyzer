// Optional Redis client. If ioredis is not installed or REDIS_URL is unset,
// returns null and the cache layer falls back to in-memory node-cache.
const logger = require("./logger");

let client = null;
let attempted = false;

function getRedis() {
  if (attempted) return client;
  attempted = true;
  if (!process.env.REDIS_URL) return null;
  try {
    const Redis = require("ioredis");
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    client.on("error", (e) => logger.warn("redis error", { msg: e.message }));
    client.on("connect", () => logger.info("redis connected"));
    return client;
  } catch (e) {
    logger.info("ioredis not installed — falling back to in-memory cache");
    return null;
  }
}

async function closeRedis() {
  if (client) {
    try { await client.quit(); } catch { /* noop */ }
    client = null;
  }
}

module.exports = { getRedis, closeRedis };
