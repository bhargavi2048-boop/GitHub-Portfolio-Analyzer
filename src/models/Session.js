const { getDb } = require("../config/db");

function now() { return Date.now(); }

const Session = {
  countDocuments(query) {
    const db = getDb();
    let count;
    if (query?.revokedAt === null && query?.expiresAt?.$gt) {
      count = db.prepare(
        "SELECT COUNT(*) as c FROM sessions WHERE revoked_at IS NULL AND expires_at > ?"
      ).get(new Date(query.expiresAt.$gt).getTime()).c;
    } else {
      count = db.prepare("SELECT COUNT(*) as c FROM sessions").get().c;
    }
    return Promise.resolve(count);
  },
};

module.exports = Session;
