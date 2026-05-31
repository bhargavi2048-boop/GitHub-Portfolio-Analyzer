const { getDb } = require("../config/db");

function now() { return Date.now(); }

const AuditLog = {
  create(data) {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, ip, user_agent, metadata, status, created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(
      data.userId || null,
      data.action,
      data.resource || null,
      data.ip || null,
      data.userAgent || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.status || "success",
      now()
    );
    return Promise.resolve();
  },

  countDocuments(query) {
    const db = getDb();
    let sql = "SELECT COUNT(*) as c FROM audit_logs WHERE 1=1";
    const params = [];
    if (query?.createdAt?.$gte) { sql += " AND created_at >= ?"; params.push(new Date(query.createdAt.$gte).getTime()); }
    if (query?.status) { sql += " AND status=?"; params.push(query.status); }
    if (query?.userId) { sql += " AND user_id=?"; params.push(query.userId); }
    const count = db.prepare(sql).get(...params).c;
    return Promise.resolve(count);
  },

  aggregate(_pipeline) {
    // Return empty — admin aggregations are best-effort
    return Promise.resolve([]);
  },
};

module.exports = AuditLog;
