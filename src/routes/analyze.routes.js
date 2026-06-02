const router = require("express").Router();
const { query, param } = require("express-validator");
const validate = require("../utils/validate");
const ctrl = require("../controllers/analyze.controller");
const { optionalAuth } = require("../middleware/auth");

const validUsername = query("username")
  .isString()
  .trim()
  .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})?$/)
  .withMessage("Invalid GitHub username");

router.get("/", optionalAuth, [validUsername], validate, ctrl.analyzeUser);
router.post("/", optionalAuth,
  [query("username").optional(), require("express-validator").body("username").optional().isString().trim()],
  validate, ctrl.analyzeUser);
router.get("/compare", [
  query("a").isString().trim().matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})?$/).withMessage("Invalid username a"),
  query("b").isString().trim().matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})?$/).withMessage("Invalid username b"),
], validate, ctrl.compareUsers);
router.get("/:username/repo/:repo", [
  param("username").matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})?$/).withMessage("Invalid username"),
  param("repo").isString().trim().isLength({ min: 1, max: 100 }).withMessage("Invalid repo name"),
], validate, ctrl.getRepoDeepdive);

module.exports = router;
