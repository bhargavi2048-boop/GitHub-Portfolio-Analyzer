const HistoryEntry = require("../models/HistoryEntry");

exports.list = async (req, res, next) => {
  try {
    const entries = await HistoryEntry.find({ user: req.user.id }).sort("-createdAt").limit(100);
    res.json(entries);
  } catch (e) { next(e); }
};

exports.clear = async (req, res, next) => {
  try {
    await HistoryEntry.deleteMany({ user: req.user.id });
    res.status(204).end();
  } catch (e) { next(e); }
};
