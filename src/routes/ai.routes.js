const router = require("express").Router();
const ctrl = require("../controllers/ai.controller");

router.post("/", ctrl.feedback);
router.post("/skillgap", ctrl.skillGap);

module.exports = router;
