const router = require("express").Router();
const ctrl = require("../controllers/report.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");

router.post("/", optionalAuth, ctrl.create);
router.get("/mine", requireAuth, ctrl.listMine);
router.get("/:id", optionalAuth, ctrl.get);
router.delete("/:id", requireAuth, ctrl.remove);

module.exports = router;
