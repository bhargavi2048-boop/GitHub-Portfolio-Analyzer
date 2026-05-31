const router = require("express").Router();
const ctrl = require("../controllers/history.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, ctrl.list);
router.delete("/", requireAuth, ctrl.clear);

module.exports = router;
