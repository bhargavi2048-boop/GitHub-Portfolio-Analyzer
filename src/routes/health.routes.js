const express = require("express");
const { getRedis } = require("../utils/redis");
const { getMetricsText, getContentType } = require("../utils/metrics");

const router = express.Router();
const startedAt = Date.now();

router.get("/", (_req, res) => {
  res.json({ status: "ok", ts: Date.now(), uptime: Math.floor((Date.now() - startedAt) / 1000) });
});

router.get("/live", (_req, res) => res.json({ status: "alive" }));

router.get("/ready", async (_req, res) => {
  // SQLite is always available if the process is running
  const checks = { sqlite: "ok", redis: "n/a" };
  const redis = getRedis();
  if (redis) {
    try { await redis.ping(); checks.redis = "ok"; }
    catch { checks.redis = "down"; }
  }
  res.status(200).json({ status: "ready", checks });
});

router.get("/metrics", async (_req, res) => {
  const text = await getMetricsText();
  res.type(getContentType()).send(text);
});

module.exports = router;
