const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../utils/validate");
const ctrl = require("../controllers/auth.controller");
const oauth = require("../controllers/oauth.controller");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

router.post("/register", authLimiter,
  [body("email").isEmail(), body("password").isLength({ min: 8 }), body("name").optional().isString().isLength({ max: 100 })],
  validate, ctrl.register);

router.post("/login", authLimiter,
  [body("email").isEmail(), body("password").isString().notEmpty()],
  validate, ctrl.login);

router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", requireAuth, ctrl.me);
router.patch("/me/digest", requireAuth, ctrl.updateDigest);

router.post("/forgot-password", authLimiter,
  [body("email").isEmail()], validate, ctrl.forgotPassword);
router.post("/reset-password", authLimiter,
  [body("email").isEmail(), body("token").isString().notEmpty(), body("password").isLength({ min: 8 })],
  validate, ctrl.resetPassword);
router.get("/verify-email", ctrl.verifyEmail);

// GitHub OAuth
router.get("/github", oauth.start);
router.get("/github/callback", oauth.callback);

module.exports = router;
