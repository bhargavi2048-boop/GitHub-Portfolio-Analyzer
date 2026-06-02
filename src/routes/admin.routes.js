const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");
const { getDb } = require("../config/db");
const adminCtrl = require("../controllers/admin.controller");

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", adminCtrl.dashboardStats);
router.get("/queues", adminCtrl.queueStats);

router.get("/stats", (_req, res) => {
  try {
    const db = getDb();
    const users = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const audits = db.prepare("SELECT COUNT(*) as c FROM audit_logs").get().c;
    res.json({ users, audits, db: "up", ts: Date.now() });
  } catch (e) {
    res.json({ users: 0, audits: 0, db: "down" });
  }
});

router.get("/audits", async (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit);
    res.json({ items: rows });
  } catch(e) { res.json({ items: [] }); }
});

router.get("/api-usage", async (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 50").all();
    res.json({ usage: rows });
  } catch(e) { res.json({ usage: [] }); }
});

module.exports = router;
