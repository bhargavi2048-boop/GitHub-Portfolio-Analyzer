const router = require("express").Router();
const ctrl = require("../controllers/resume.controller");
const { optionalAuth, requireAuth } = require("../middleware/auth");

router.post("/", optionalAuth, ctrl.upload, ctrl.analyzeResume);
router.get("/history", requireAuth, ctrl.history);

module.exports = router;
