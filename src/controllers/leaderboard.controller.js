const Leaderboard = require("../models/Leaderboard");

exports.getLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const entries = await Leaderboard.find()
      .sort({ score: -1 })
      .limit(limit)
      .lean();
    const ranked = entries.map((e, i) => ({ ...e, position: i + 1 }));
    res.set("Cache-Control", "public, max-age=60");
    res.json({ leaderboard: ranked, total: await Leaderboard.countDocuments() });
  } catch (e) { next(e); }
};

exports.getUserRank = async (req, res, next) => {
  try {
    const { username } = req.params;
    const entry = await Leaderboard.findOne({ username }).lean();
    if (!entry) return res.status(404).json({ error: "Not found", code: "NOT_ON_LEADERBOARD" });
    const position = (await Leaderboard.countDocuments({ score: { $gt: entry.score } })) + 1;
    const total = await Leaderboard.countDocuments();
    res.json({ position, total, score: entry.score, rank: entry.rank, username: entry.username });
  } catch (e) { next(e); }
};
