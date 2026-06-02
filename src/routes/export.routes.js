const router = require("express").Router();
const ctrl = require("../controllers/export.controller");
router.get("/:username.pdf", ctrl.pdf);
module.exports = router;
