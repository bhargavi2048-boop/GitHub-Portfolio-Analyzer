const Report = require("../models/Report");

exports.create = async (req, res, next) => {
  try {
    const { username, profile, stats, score, ai, public: isPublic } = req.body;
    if (!username || !profile || !stats || !score) {
      return res.status(400).json({ error: "Missing report fields" });
    }
    const report = await Report.create({
      user: req.user?.id,
      username,
      profile,
      stats,
      score,
      ai: ai || null,
      public: !!isPublic,
    });
    res.status(201).json(report);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (!report.public && (!req.user || String(report.user) !== req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(report);
  } catch (e) { next(e); }
};

exports.listMine = async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort("-createdAt").limit(50);
    res.json(reports);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await Report.deleteOne({ _id: req.params.id, user: req.user.id });
    res.status(204).end();
  } catch (e) { next(e); }
};
