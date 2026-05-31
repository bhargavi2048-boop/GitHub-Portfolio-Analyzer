const { gh } = require("../services/github.service");
const { memo } = require("../utils/cache");

// Search GitHub users.
exports.searchUsers = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.status(400).json({ error: "Query too short" });
    const per_page = Math.min(Number(req.query.limit) || 10, 30);
    const data = await memo(`search:users:${q}:${per_page}`, 120, () =>
      gh(`/search/users?q=${encodeURIComponent(q)}&per_page=${per_page}`)
    );
    res.json({
      total: data.total_count,
      items: (data.items || []).map((u) => ({
        login: u.login,
        id: u.id,
        avatar_url: u.avatar_url,
        html_url: u.html_url,
        type: u.type,
      })),
    });
  } catch (e) { next(e); }
};

// Trending developers proxy via search API by follower count.
exports.trending = async (req, res, next) => {
  try {
    const language = String(req.query.language || "").trim();
    const location = String(req.query.location || "").trim();
    const qParts = ["followers:>500"];
    if (language) qParts.push(`language:${language}`);
    if (location) qParts.push(`location:${location}`);
    const q = qParts.join(" ");
    const data = await memo(`trending:${q}`, 600, () =>
      gh(`/search/users?q=${encodeURIComponent(q)}&sort=followers&order=desc&per_page=12`)
    );
    res.json({
      items: (data.items || []).map((u) => ({
        login: u.login,
        avatar_url: u.avatar_url,
        html_url: u.html_url,
      })),
    });
  } catch (e) { next(e); }
};

// Popular profiles — curated + cached.
const POPULAR = ["torvalds","gaearon","sindresorhus","yyx990803","tj","kentcdodds","addyosmani","getify","mojombo","defunkt"];
exports.popular = async (_req, res, next) => {
  try {
    const data = await memo("popular:list", 3600, async () => {
      const results = await Promise.all(
        POPULAR.map((login) => gh(`/users/${login}`).catch(() => null))
      );
      return results.filter(Boolean).map((u) => ({
        login: u.login,
        name: u.name,
        avatar_url: u.avatar_url,
        followers: u.followers,
        public_repos: u.public_repos,
        bio: u.bio,
      }));
    });
    res.json({ items: data });
  } catch (e) { next(e); }
};
