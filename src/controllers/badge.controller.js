// SVG badge endpoint — /api/badge/:username
const { analyze } = require("../services/github.service");

const RANK_COLORS = { S: "#0d7377", A: "#14919b", B: "#76c7d1", C: "#ffc107", D: "#dc3545" };
const RANK_LABELS = { S: "S-Rank", A: "A-Rank", B: "B-Rank", C: "C-Rank", D: "D-Rank" };

function buildSvg(rank, score, username) {
  const rankColor = RANK_COLORS[rank] || "#0d7377";
  const label = "GitHub Portfolio";
  const value = `${RANK_LABELS[rank] || rank}  ${score}/100`;
  const labelW = 140;
  const valueW = 130;
  const totalW = labelW + valueW;
  const h = 28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${h}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <defs>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r"><rect width="${totalW}" height="${h}" rx="5" fill="#fff"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${h}" fill="#051d2a"/>
    <rect x="${labelW}" width="${valueW}" height="${h}" fill="${rankColor}"/>
    <rect width="${totalW}" height="${h}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Segoe UI,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="18" fill="#000" fill-opacity=".3" textLength="${labelW - 24}" lengthAdjust="spacing">${label}</text>
    <text x="${labelW / 2}" y="17" textLength="${labelW - 24}" lengthAdjust="spacing">${label}</text>
    <text x="${labelW + valueW / 2}" y="18" fill="#000" fill-opacity=".3" textLength="${valueW - 16}" lengthAdjust="spacing">${value}</text>
    <text x="${labelW + valueW / 2}" y="17" textLength="${valueW - 16}" lengthAdjust="spacing">${value}</text>
  </g>
</svg>`;
}

exports.badge = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username))
      return res.status(400).send("Invalid username");
    const data = await analyze(username);
    const { rank, total } = data.score;
    res.set("Content-Type", "image/svg+xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.set("X-Content-Type-Options", "nosniff");
    res.send(buildSvg(rank, total, username));
  } catch (e) { next(e); }
};
