const router = require("express").Router();
const ctrl = require("../controllers/badge.controller");
// No auth required — public endpoint
router.get("/:username", ctrl.badge);
module.exports = router;
