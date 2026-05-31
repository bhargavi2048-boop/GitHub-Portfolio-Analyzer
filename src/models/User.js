const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { getDb } = require("../config/db");

function now() { return Date.now(); }

function rowToUser(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    _id: row.id,          // compat shim
    emailVerified: !!row.email_verified,
    weeklyDigest: !!row.weekly_digest,
    githubId: row.github_id,
    githubLogin: row.github_login,
    avatarUrl: row.avatar_url,
    githubAccessToken: row.github_access_token,
    emailVerificationToken: row.email_verification_token,
    passwordResetToken: row.password_reset_token,
    passwordResetExpires: row.password_reset_expires ? new Date(row.password_reset_expires) : null,
    failedLoginAttempts: row.failed_login_attempts || 0,
    lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

const User = {
  async create(data) {
    const db = getDb();
    let hashedPw = null;
    if (data.password) hashedPw = await bcrypt.hash(data.password, 10);

    const verToken = data.emailVerificationToken
      ? crypto.createHash("sha256").update(data.emailVerificationToken).digest("hex")
      : null;

    const stmt = db.prepare(`
      INSERT INTO users
        (email, password, name, role, github_id, github_login, avatar_url,
         email_verified, email_verification_token, weekly_digest, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ts = now();
    const info = stmt.run(
      (data.email || "").toLowerCase().trim(),
      hashedPw,
      data.name || null,
      data.role || "user",
      data.githubId || null,
      data.githubLogin || null,
      data.avatarUrl || null,
      data.emailVerified ? 1 : 0,
      verToken || null,
      data.weeklyDigest ? 1 : 0,
      ts, ts
    );
    return rowToUser(db.prepare("SELECT * FROM users WHERE id=?").get(info.lastInsertRowid));
  },

  findOne(query) {
    const db = getDb();
    if (query.email) {
      return Promise.resolve(rowToUser(db.prepare("SELECT * FROM users WHERE email=? COLLATE NOCASE").get(query.email)));
    }
    if (query.id || query._id) {
      return Promise.resolve(rowToUser(db.prepare("SELECT * FROM users WHERE id=?").get(query.id || query._id)));
    }
    if (query.githubId) {
      return Promise.resolve(rowToUser(db.prepare("SELECT * FROM users WHERE github_id=?").get(query.githubId)));
    }
    if (query.$or) {
      for (const cond of query.$or) {
        const u = User.findOne(cond);
        if (u) return u;
      }
      return Promise.resolve(null);
    }
    return Promise.resolve(null);
  },

  findById(id) {
    const db = getDb();
    return Promise.resolve(rowToUser(db.prepare("SELECT * FROM users WHERE id=?").get(id)));
  },

  findByIdAndUpdate(id, update, _opts) {
    const db = getDb();
    if (update.weeklyDigest !== undefined) {
      db.prepare("UPDATE users SET weekly_digest=?, updated_at=? WHERE id=?")
        .run(update.weeklyDigest ? 1 : 0, now(), id);
    }
    return Promise.resolve(rowToUser(db.prepare("SELECT * FROM users WHERE id=?").get(id)));
  },

  find(query) {
    const db = getDb();
    let rows;
    if (query && query.weeklyDigest) {
      rows = db.prepare("SELECT * FROM users WHERE weekly_digest=1").all();
    } else {
      rows = db.prepare("SELECT * FROM users").all();
    }
    const users = rows.map(rowToUser);
    // Attach lean() and catch() for compat
    const result = Promise.resolve(users);
    result.lean = () => result;
    result.catch = (fn) => result.then(null, fn);
    return result;
  },

  async save(user) {
    // Called as user.save() — update all mutable fields
    const db = getDb();
    db.prepare(`
      UPDATE users SET
        password=?, name=?, role=?, github_id=?, github_login=?,
        avatar_url=?, email_verified=?, email_verification_token=?,
        password_reset_token=?, password_reset_expires=?,
        failed_login_attempts=?, locked_until=?, weekly_digest=?,
        last_login_at=?, updated_at=?
      WHERE id=?
    `).run(
      user.password || null,
      user.name || null,
      user.role || "user",
      user.githubId || user.github_id || null,
      user.githubLogin || user.github_login || null,
      user.avatarUrl || user.avatar_url || null,
      user.emailVerified ? 1 : 0,
      user.emailVerificationToken || user.email_verification_token || null,
      user.passwordResetToken || user.password_reset_token || null,
      user.passwordResetExpires ? new Date(user.passwordResetExpires).getTime() : null,
      user.failedLoginAttempts || 0,
      user.lockedUntil ? new Date(user.lockedUntil).getTime() : null,
      user.weeklyDigest ? 1 : 0,
      user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : null,
      now(),
      user.id || user._id
    );
    return rowToUser(db.prepare("SELECT * FROM users WHERE id=?").get(user.id || user._id));
  },
};

// Instance methods attached to each user object
function attachMethods(user) {
  if (!user) return null;
  user.compare = async function(plain) {
    if (!this.password) return false;
    const db = getDb();
    const row = db.prepare("SELECT password FROM users WHERE id=?").get(this.id);
    if (!row?.password) return false;
    return bcrypt.compare(plain, row.password);
  };
  user.save = async function() {
    // If password changed (raw, not hashed), hash it
    if (this._passwordChanged) {
      this.password = await bcrypt.hash(this.password, 10);
      this._passwordChanged = false;
    }
    return User.save(this);
  };
  // Setter to detect raw password assignment
  Object.defineProperty(user, 'password', {
    get() { return this._password; },
    set(v) {
      if (v && v.length < 60) this._passwordChanged = true;
      this._password = v;
    },
    enumerable: true, configurable: true
  });
  return user;
}

// Proxy to auto-attach instance methods
const UserProxy = new Proxy(User, {
  get(target, prop) {
    const orig = target[prop];
    if (typeof orig !== 'function') return orig;
    return async function(...args) {
      const result = await orig(...args);
      if (Array.isArray(result)) return result.map(attachMethods);
      if (result && typeof result === 'object' && result.id) return attachMethods(result);
      return result;
    };
  }
});

module.exports = UserProxy;
