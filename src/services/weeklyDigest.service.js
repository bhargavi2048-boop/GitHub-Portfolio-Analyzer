const logger = require("../utils/logger");
const { sendMail } = require("../utils/mailer");
const { analyze } = require("./github.service");

let cron;
try { cron = require("node-cron"); } catch { /* optional */ }

async function runDigest() {
  let User, HistoryEntry;
  try {
    User = require("../models/User");
    HistoryEntry = require("../models/HistoryEntry");
  } catch { return; }

  const users = await User.find({ weeklyDigest: true }).catch(() => []);
  logger.info(`[weeklyDigest] running for ${users.length} subscribed users`);

  for (const user of users) {
    try {
      const entries = await HistoryEntry.find({ user: user.id }).sort("-createdAt").limit(20);
      if (!entries.length) continue;

      const usernames = [...new Set(entries.map(e => e.username))].slice(0, 5);
      const rows = [];
      for (const uname of usernames) {
        try {
          const fresh = await analyze(uname);
          const last = entries.find(e => e.username === uname);
          const change = last?.score != null ? fresh.score.total - last.score : null;
          rows.push({ username: uname, score: fresh.score.total, rank: fresh.score.rank, change, changeStr: change === null ? "New" : change > 0 ? `+${change}` : `${change}` });
        } catch { /* skip */ }
      }
      if (!rows.length) continue;

      const appUrl = process.env.APP_URL || "http://localhost:5000";
      const html = `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
        <h1>📊 Weekly Portfolio Digest</h1>
        ${rows.map(r => `<div style="border-left:4px solid #0d7377;padding:12px;margin-bottom:10px;">
          <strong>@${r.username}</strong> — ${r.score}/100 (${r.rank}-Rank)
          <br/>${r.change > 0 ? "📈" : r.change < 0 ? "📉" : "➡️"} ${r.changeStr}
        </div>`).join("")}
        <p><a href="${appUrl}">View full analysis →</a></p>
      </div>`;

      await sendMail({
        to: user.email,
        subject: "📊 Your Weekly GitHub Portfolio Digest",
        html,
        text: rows.map(r => `${r.username}: ${r.score}/100 (${r.rank}) — ${r.changeStr}`).join("\n")
      });
      logger.info(`[weeklyDigest] sent to ${user.email}`);
    } catch (e) {
      logger.error(`[weeklyDigest] failed for ${user.email}`, { msg: e.message });
    }
  }
}

function startWeeklyDigest() {
  if (!cron) {
    logger.warn("[weeklyDigest] node-cron not installed — weekly digest disabled");
    return;
  }
  cron.schedule("0 8 * * 1", () => {
    logger.info("[weeklyDigest] cron triggered");
    runDigest().catch(e => logger.error("[weeklyDigest] error", { msg: e.message }));
  }, { timezone: "UTC" });
  logger.info("[weeklyDigest] scheduled for Mondays at 08:00 UTC");
}

module.exports = { startWeeklyDigest, runDigest };
