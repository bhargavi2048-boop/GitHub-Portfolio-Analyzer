const router = require("express").Router();
const ctrl = require("../controllers/discover.controller");

router.get("/search", ctrl.searchUsers);
router.get("/trending", ctrl.trending);
router.get("/popular", ctrl.popular);

module.exports = router;
