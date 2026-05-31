const { getDb } = require("../config/db");

function now() { return Date.now(); }

function rowToResume(row) {
  if (!row) return null;
  return {
    id: row.id, _id: row.id,
    user: row.user_id,
    filename: row.filename,
    text: row.text,
    skills: JSON.parse(row.skills || "[]"),
    atsScore: row.ats_score,
    issues: JSON.parse(row.issues || "[]"),
    suggestions: JSON.parse(row.suggestions || "[]"),
    githubUsername: row.github_username,
    matchScore: row.match_score,
    createdAt: new Date(row.created_at),
  };
}

const ResumeAnalysis = {
  create(data) {
    const db = getDb();
    db.prepare(`
      INSERT INTO resume_analyses
        (user_id, filename, text, skills, ats_score, issues, suggestions, github_username, match_score, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(
      data.user || null,
      data.filename || null,
      data.text || null,
      JSON.stringify(data.skills || []),
      data.atsScore || 0,
      JSON.stringify(data.issues || []),
      JSON.stringify(data.suggestions || []),
      data.githubUsername || null,
      data.matchScore || 0,
      now()
    );
    return Promise.resolve();
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
          const rows = db.prepare("SELECT * FROM resume_analyses WHERE user_id=? ORDER BY created_at DESC LIMIT ?")
            .all(this._userId, this._limit);
          return Promise.resolve(rows.map(rowToResume)).then(resolve, reject);
        } catch(e) { return Promise.reject(e).then(resolve, reject); }
      },
      catch(fn) { return Promise.resolve(this).then(null, fn); }
    };
    return chainable;
  },
};

module.exports = ResumeAnalysis;
