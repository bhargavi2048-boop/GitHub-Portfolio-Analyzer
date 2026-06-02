const { getDb } = require("../config/db");

function now() { return Date.now(); }

const HistoryEntry = {
  create(data) {
    const db = getDb();
    const ts = now();
    const info = db.prepare(
      "INSERT INTO history_entries (user_id, username, score, rank, created_at) VALUES (?,?,?,?,?)"
    ).run(data.user, data.username, data.score ?? null, data.rank || null, ts);
    return Promise.resolve({ id: info.lastInsertRowid, ...data });
  },

  find(query) {
    const db = getDb();
    let stmt;
    if (query?.user) {
      stmt = db.prepare("SELECT * FROM history_entries WHERE user_id=? ORDER BY created_at DESC");
    } else {
      stmt = db.prepare("SELECT * FROM history_entries ORDER BY created_at DESC");
    }
    const base = stmt;
    const chainable = {
      _userId: query?.user,
      _limit: 100,
      sort(_s) { return this; },
      limit(n) { this._limit = n; return this; },
      lean() { return this; },
      then(resolve, reject) {
        try {
          const rows = base.all(this._userId ?? []).slice(0, this._limit).map(row => ({
            id: row.id,
            _id: row.id,
            user: row.user_id,
            username: row.username,
            score: row.score,
            rank: row.rank,
            createdAt: new Date(row.created_at),
          }));
          return Promise.resolve(rows).then(resolve, reject);
        } catch(e) { return Promise.reject(e).then(resolve, reject); }
      },
      catch(fn) { return Promise.resolve(this).then(null, fn); }
    };
    return chainable;
  },

  deleteMany(query) {
    const db = getDb();
    if (query?.user) {
      db.prepare("DELETE FROM history_entries WHERE user_id=?").run(query.user);
    }
    return Promise.resolve({ deletedCount: 1 });
  },
};

module.exports = HistoryEntry;
