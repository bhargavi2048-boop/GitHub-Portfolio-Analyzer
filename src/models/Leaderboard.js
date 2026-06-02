const { getDb } = require("../config/db");

function now() { return Date.now(); }

const Leaderboard = {
  findOneAndUpdate(filter, data, _opts) {
    const db = getDb();
    const existing = db.prepare("SELECT id FROM leaderboard WHERE username=?").get(filter.username);
    if (existing) {
      db.prepare(`
        UPDATE leaderboard SET avatar_url=?, score=?, rank=?, languages=?, updated_at=? WHERE username=?
      `).run(data.avatarUrl || "", data.score, data.rank, JSON.stringify(data.languages || []), now(), filter.username);
    } else {
      db.prepare(`
        INSERT INTO leaderboard (username, avatar_url, score, rank, languages, updated_at)
        VALUES (?,?,?,?,?,?)
      `).run(data.username, data.avatarUrl || "", data.score, data.rank, JSON.stringify(data.languages || []), now());
    }
    return Promise.resolve(db.prepare("SELECT * FROM leaderboard WHERE username=?").get(filter.username));
  },

  find() {
    const db = getDb();
    const chainable = {
      _limit: 50,
      sort(_s) { return this; },
      limit(n) { this._limit = n; return this; },
      lean() { return this; },
      then(resolve, reject) {
        try {
          const rows = db.prepare("SELECT * FROM leaderboard ORDER BY score DESC LIMIT ?").all(this._limit);
          const mapped = rows.map(r => ({
            id: r.id, _id: r.id,
            username: r.username,
            avatarUrl: r.avatar_url,
            score: r.score,
            rank: r.rank,
            languages: JSON.parse(r.languages || "[]"),
            updatedAt: new Date(r.updated_at),
          }));
          return Promise.resolve(mapped).then(resolve, reject);
        } catch(e) { return Promise.reject(e).then(resolve, reject); }
      },
      catch(fn) { return Promise.resolve(this).then(null, fn); }
    };
    return chainable;
  },

  findOne(query) {
    const db = getDb();
    const row = db.prepare("SELECT * FROM leaderboard WHERE username=?").get(query.username);
    if (!row) return Promise.resolve(null);
    return Promise.resolve({
      id: row.id, _id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      score: row.score,
      rank: row.rank,
      languages: JSON.parse(row.languages || "[]"),
    });
  },

  countDocuments(query) {
    const db = getDb();
    let count;
    if (query?.score?.$gt !== undefined) {
      count = db.prepare("SELECT COUNT(*) as c FROM leaderboard WHERE score > ?").get(query.score.$gt).c;
    } else {
      count = db.prepare("SELECT COUNT(*) as c FROM leaderboard").get().c;
    }
    return Promise.resolve(count);
  },
};

module.exports = Leaderboard;
