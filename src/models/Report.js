const { getDb } = require("../config/db");

function now() { return Date.now(); }

function rowToReport(row) {
  if (!row) return null;
  return {
    id: row.id, _id: row.id,
    user: row.user_id,
    username: row.username,
    profile: JSON.parse(row.profile),
    stats: JSON.parse(row.stats),
    score: JSON.parse(row.score),
    ai: row.ai ? JSON.parse(row.ai) : null,
    public: !!row.public,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const Report = {
  create(data) {
    const db = getDb();
    const ts = now();
    const info = db.prepare(`
      INSERT INTO reports (user_id, username, profile, stats, score, ai, public, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      data.user || null,
      data.username,
      JSON.stringify(data.profile),
      JSON.stringify(data.stats),
      JSON.stringify(data.score),
      data.ai ? JSON.stringify(data.ai) : null,
      data.public ? 1 : 0,
      ts, ts
    );
    return Promise.resolve(rowToReport(db.prepare("SELECT * FROM reports WHERE id=?").get(info.lastInsertRowid)));
  },

  findById(id) {
    const db = getDb();
    return Promise.resolve(rowToReport(db.prepare("SELECT * FROM reports WHERE id=?").get(id)));
  },

  find(query) {
    const db = getDb();
    const chainable = {
      _userId: query?.user,
      _limit: 50,
      sort(_s) { return this; },
      limit(n) { this._limit = n; return this; },
      then(resolve, reject) {
        try {
          const rows = db.prepare("SELECT * FROM reports WHERE user_id=? ORDER BY created_at DESC LIMIT ?")
            .all(this._userId, this._limit);
          return Promise.resolve(rows.map(rowToReport)).then(resolve, reject);
        } catch(e) { return Promise.reject(e).then(resolve, reject); }
      },
      catch(fn) { return Promise.resolve(this).then(null, fn); }
    };
    return chainable;
  },

  deleteOne(query) {
    const db = getDb();
    db.prepare("DELETE FROM reports WHERE id=? AND user_id=?").run(query._id, query.user);
    return Promise.resolve({ deletedCount: 1 });
  },
};

module.exports = Report;
