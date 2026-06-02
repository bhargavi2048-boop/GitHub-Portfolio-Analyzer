const { analyze } = require("../services/github.service");
const { gh } = require("../services/github.service");
const HistoryEntry = require("../models/HistoryEntry");
const Leaderboard = require("../models/Leaderboard");

const USER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

exports.analyzeUser = async (req, res, next) => {
  try {
    const username = String(req.query.username || req.body?.username || req.params.username || "").trim();
    if (!USER_RE.test(username)) return res.status(400).json({ error: "Invalid GitHub username", code: "INVALID_USERNAME" });

    const data = await analyze(username);

    if (req.user?.id) {
      HistoryEntry.create({
        user: req.user.id,
        username,
        score: data.score.total,
        rank: data.score.rank,
      }).catch(() => {});
    }

    // Upsert leaderboard — include language data for leaderboard page
    Leaderboard.findOneAndUpdate(
      { username },
      {
        username,
        avatarUrl: data.profile?.avatar_url || "",
        score: data.score.total,
        rank: data.score.rank,
        languages: (data.stats?.languages || []).slice(0, 5),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    ).catch(() => {});

    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (e) { next(e); }
};

exports.compareUsers = async (req, res, next) => {
  try {
    const a = String(req.query.a || "").trim();
    const b = String(req.query.b || "").trim();
    if (!USER_RE.test(a) || !USER_RE.test(b)) return res.status(400).json({ error: "Invalid usernames", code: "INVALID_USERNAME" });
    const [A, B] = await Promise.all([analyze(a), analyze(b)]);
    res.json({ a: A, b: B });
  } catch (e) { next(e); }
};

exports.getRepoDeepdive = async (req, res, next) => {
  try {
    const { username, repo } = req.params;
    if (!USER_RE.test(username)) return res.status(400).json({ error: "Invalid username", code: "INVALID_USERNAME" });

    const [languages, contributors, commits, repoInfo] = await Promise.allSettled([
      gh(`/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/languages`),
      gh(`/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/contributors?per_page=3`),
      gh(`/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/commits?per_page=1`),
      gh(`/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}`),
    ]);

    const langData = languages.status === "fulfilled" ? languages.value : {};
    const totalBytes = Object.values(langData).reduce((a, b) => a + b, 0) || 1;
    const topLanguages = Object.entries(langData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, bytes]) => ({ name, pct: Math.round((bytes / totalBytes) * 100) }));

    const topContributors = (contributors.status === "fulfilled" ? contributors.value : []).slice(0, 3);
    const lastCommit = commits.status === "fulfilled" && commits.value?.[0]
      ? commits.value[0].commit?.committer?.date || null
      : null;
    const repoDetail = repoInfo.status === "fulfilled" ? repoInfo.value : {};
    const openIssues = repoDetail.open_issues_count || 0;

    let readmePreview = "";
    try {
      const readmeData = await gh(`/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/readme`);
      if (readmeData?.content) {
        const decoded = Buffer.from(readmeData.content, "base64").toString("utf8");
        readmePreview = decoded.slice(0, 400);
      }
    } catch { /* no readme */ }

    res.json({ topLanguages, topContributors, openIssues, lastCommit, readmePreview });
  } catch (e) { next(e); }
};
