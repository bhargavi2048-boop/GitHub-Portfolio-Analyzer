const { getDb } = require("../config/db");

function now() { return Date.now(); }

function rowToToken(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    _id: row.id,
    user: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: new Date(row.expires_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
    userAgent: row.user_agent,
    createdAt: new Date(row.created_at),
  };
}

const RefreshToken = {
  create(data) {
    const db = getDb();
    const ts = now();
    const info = db.prepare(`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.user,
      data.tokenHash,
      new Date(data.expiresAt).getTime(),
      data.userAgent || null,
      data.ip || null,
      ts
    );
    return Promise.resolve(rowToToken(db.prepare("SELECT * FROM refresh_tokens WHERE id=?").get(info.lastInsertRowid)));
  },

  findOne(query) {
    const db = getDb();
    if (query.tokenHash && query.user) {
      // Check not revoked (revokedAt: { $exists: false })
      const row = db.prepare(
        "SELECT * FROM refresh_tokens WHERE token_hash=? AND user_id=? AND revoked_at IS NULL"
      ).get(query.tokenHash, query.user);
      const token = rowToToken(row);
      if (token) {
        token.save = async function() {
          db.prepare("UPDATE refresh_tokens SET revoked_at=? WHERE id=?")
            .run(this.revokedAt ? new Date(this.revokedAt).getTime() : null, this.id);
        };
      }
      return Promise.resolve(token);
    }
    if (query.tokenHash) {
      const row = db.prepare("SELECT * FROM refresh_tokens WHERE token_hash=?").get(query.tokenHash);
      return Promise.resolve(rowToToken(row));
    }
    return Promise.resolve(null);
  },

  updateOne(filter, update) {
    const db = getDb();
    if (filter.tokenHash && update.$set?.revokedAt) {
      db.prepare("UPDATE refresh_tokens SET revoked_at=? WHERE token_hash=?")
        .run(new Date(update.$set.revokedAt).getTime(), filter.tokenHash);
    }
    return Promise.resolve({ modifiedCount: 1 });
  },

  updateMany(filter, update) {
    const db = getDb();
    if (filter.user && update.$set?.revokedAt) {
      db.prepare("UPDATE refresh_tokens SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL")
        .run(new Date(update.$set.revokedAt).getTime(), filter.user);
    }
    return Promise.resolve({ modifiedCount: 1 });
  },
};

module.exports = RefreshToken;
