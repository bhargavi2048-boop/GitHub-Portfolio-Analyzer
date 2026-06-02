// Two-tier cache: Redis (if available) + in-process node-cache.
// API is backwards-compatible with the previous memo/bust signature.
const NodeCache = require("node-cache");
const { getRedis } = require("./redis");
const logger = require("./logger");

const local = new NodeCache({ stdTTL: 300, checkperiod: 120, useClones: false });
const NS = process.env.CACHE_NAMESPACE || "gpa";
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS || 300);

const key = (k) => `${NS}:${k}`;

async function get(k) {
  const hit = local.get(k);
  if (hit !== undefined) return hit;
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(key(k));
      if (raw != null) {
        const val = JSON.parse(raw);
        local.set(k, val);
        return val;
      }
    } catch (e) { logger.warn("redis get failed", { msg: e.message }); }
  }
  return undefined;
}

async function set(k, val, ttl = DEFAULT_TTL) {
  local.set(k, val, ttl);
  const redis = getRedis();
  if (redis) {
    try { await redis.set(key(k), JSON.stringify(val), "EX", ttl); }
    catch (e) { logger.warn("redis set failed", { msg: e.message }); }
  }
}

async function memo(k, ttl, producer) {
  const cached = await get(k);
  if (cached !== undefined) return cached;
  const val = await producer();
  await set(k, val, ttl || DEFAULT_TTL);
  return val;
}

async function bust(prefix) {
  const keys = local.keys().filter((kk) => kk.startsWith(prefix));
  local.del(keys);
  const redis = getRedis();
  if (redis) {
    try {
      const stream = redis.scanStream({ match: `${NS}:${prefix}*`, count: 100 });
      const pipeline = redis.pipeline();
      stream.on("data", (ks) => ks.forEach((kk) => pipeline.del(kk)));
      stream.on("end", () => pipeline.exec().catch(() => {}));
    } catch (e) { logger.warn("redis bust failed", { msg: e.message }); }
  }
}

module.exports = { memo, bust, get, set, store: local };
