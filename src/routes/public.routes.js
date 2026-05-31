const router = require("express").Router();
const ctrl = require("../controllers/public.controller");

router.get("/card/:username", ctrl.profileCard);
router.get("/:username", ctrl.publicProfile);

module.exports = router;
