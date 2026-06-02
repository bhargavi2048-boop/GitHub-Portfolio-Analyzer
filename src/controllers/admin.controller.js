const AuditLog = require("../models/AuditLog");
const Session = require("../models/Session");
const { getQueue } = require("../utils/queue");

exports.dashboardStats = async (_req, res, next) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now - 86400000);
    const weekAgo = new Date(now - 7 * 86400000);
    const monthAgo = new Date(now - 30 * 86400000);

    const [todayCount, weekCount, monthCount, apiErrors, activeSessions] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: dayAgo } }).catch(() => 0),
      AuditLog.countDocuments({ createdAt: { $gte: weekAgo } }).catch(() => 0),
      AuditLog.countDocuments({ createdAt: { $gte: monthAgo } }).catch(() => 0),
      AuditLog.countDocuments({ status: "failure", createdAt: { $gte: dayAgo } }).catch(() => 0),
      Session.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }).catch(() => 0),
    ]);

    res.json({
      analyses: { today: todayCount, week: weekCount, month: monthCount },
      topUsernames: [],
      scoreDistribution: [],
      apiErrorRate: { errorsToday: apiErrors, total: todayCount, rate: todayCount ? ((apiErrors / todayCount) * 100).toFixed(1) : 0 },
      activeSessions,
      ts: Date.now()
    });
  } catch (e) { next(e); }
};

exports.queueStats = async (_req, res, next) => {
  try {
    const queueNames = (process.env.BULL_QUEUES || "analysis,ai,digest").split(",").map(s => s.trim());
    const stats = [];
    for (const name of queueNames) {
      const q = getQueue(name);
      if (!q) { stats.push({ name, available: false, reason: "BullMQ/Redis not configured" }); continue; }
      try {
        const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
          q.getWaitingCount().catch(() => 0),
          q.getActiveCount().catch(() => 0),
          q.getCompletedCount().catch(() => 0),
          q.getFailedCount().catch(() => 0),
          q.getDelayedCount().catch(() => 0),
          q.getPausedCount().catch(() => 0),
        ]);
        const recentFailed = await q.getFailed(0, 9).catch(() => []);
        stats.push({
          name, available: true,
          counts: { waiting, active, completed, failed, delayed, paused },
          recentFailures: recentFailed.map(j => ({ id: j.id, name: j.name, failedReason: j.failedReason, attemptsMade: j.attemptsMade, timestamp: j.timestamp })),
        });
      } catch (e) { stats.push({ name, available: false, reason: e.message }); }
    }
    res.json({ queues: stats, ts: Date.now() });
  } catch (e) { next(e); }
};
