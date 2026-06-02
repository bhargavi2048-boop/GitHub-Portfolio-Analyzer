const router = require("express").Router();
const ctrl = require("../controllers/leaderboard.controller");

router.get("/", ctrl.getLeaderboard);
router.get("/rank/:username", ctrl.getUserRank);

module.exports = router;
