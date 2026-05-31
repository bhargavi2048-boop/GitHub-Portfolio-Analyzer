// Public, share-friendly profile snapshot endpoint.
const { analyze } = require("../services/github.service");

const USER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

exports.publicProfile = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!USER_RE.test(username)) return res.status(400).json({ error: "Invalid GitHub username" });
    const data = await analyze(username);
    res.set("Cache-Control", "public, max-age=600");
    // Lean public payload (no internal-only fields)
    res.json({
      username,
      profile: {
        login: data.profile.login,
        name: data.profile.name,
        bio: data.profile.bio,
        avatar_url: data.profile.avatar_url,
        html_url: data.profile.html_url,
        followers: data.profile.followers,
        following: data.profile.following,
        public_repos: data.profile.public_repos,
        location: data.profile.location,
        blog: data.profile.blog,
      },
      score: data.score,
      stats: {
        totalStars: data.stats.totalStars,
        totalForks: data.stats.totalForks,
        languages: data.stats.languages,
        topRepos: data.stats.topRepos.map((r) => ({
          name: r.name,
          html_url: r.html_url,
          description: r.description,
          stargazers_count: r.stargazers_count,
          forks_count: r.forks_count,
          language: r.language,
          topics: r.topics,
        })),
        activityByMonth: data.stats.activityByMonth,
      },
      sharedAt: new Date().toISOString(),
    });
  } catch (e) { next(e); }
};

exports.profileCard = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username))
      return res.status(400).send("Invalid username");

    const data = await analyze(username);
    const profile = data.profile;
    const score = data.score;
    const langs = (data.stats.languages || []).slice(0, 3).map(l => l.name);
    const totalStars = data.stats.totalStars || 0;
    const rankBadgeColor = { S: "#f5a623", A: "#7ed321", B: "#4a90e2", C: "#9b59b6", D: "#e74c3c" }[score.rank] || "#0d7377";

    // Fetch avatar as base64
    let avatarB64 = "";
    try {
      const avatarRes = await fetch(profile.avatar_url);
      const buf = await avatarRes.arrayBuffer();
      avatarB64 = `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;
    } catch { /* use placeholder */ }

    const svg = `<svg width="560" height="200" viewBox="0 0 560 200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="avatar-clip">
      <circle cx="96" cy="96" r="52"/>
    </clipPath>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d7377"/>
      <stop offset="100%" style="stop-color:#051d2a"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="560" height="200" rx="14" fill="url(#bg-grad)"/>
  <!-- Avatar circle -->
  <circle cx="96" cy="96" r="54" fill="rgba(255,255,255,0.15)"/>
  ${avatarB64 ? `<image href="${avatarB64}" x="44" y="44" width="104" height="104" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice"/>` : `<circle cx="96" cy="96" r="52" fill="#14919b"/><text x="96" y="104" text-anchor="middle" font-size="40" fill="white">👤</text>`}
  <!-- Score circle -->
  <circle cx="466" cy="56" r="44" fill="rgba(255,255,255,0.12)"/>
  <text x="466" y="48" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="rgba(255,255,255,0.7)">SCORE</text>
  <text x="466" y="74" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="32" font-weight="700" fill="white">${score.total}</text>
  <!-- Rank badge -->
  <rect x="${466 - 22}" y="90" width="44" height="22" rx="11" fill="${rankBadgeColor}"/>
  <text x="466" y="106" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="700" fill="white">${score.rank}-Rank</text>
  <!-- Name & username -->
  <text x="176" y="68" font-family="Segoe UI,Arial,sans-serif" font-size="20" font-weight="700" fill="white">${(profile.name || username).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</text>
  <text x="176" y="92" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="rgba(255,255,255,0.7)">@${username}</text>
  <!-- Stars -->
  <text x="176" y="118" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="#76c7d1">⭐ ${totalStars} total stars</text>
  <!-- Languages -->
  <text x="176" y="148" font-family="Segoe UI,Arial,sans-serif" font-size="12" fill="rgba(255,255,255,0.6)">${langs.join("  ·  ")}</text>
  <!-- Footer -->
  <text x="280" y="186" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.4)">GitHub Portfolio Analyzer</text>
</svg>`;

    res.set("Content-Type", "image/svg+xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(svg);
  } catch (e) { next(e); }
};
