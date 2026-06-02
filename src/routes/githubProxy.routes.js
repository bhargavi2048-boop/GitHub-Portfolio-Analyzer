// Transparent server-side proxy to api.github.com.
// Lets the untouched Project A frontend (which calls api.github.com directly)
// gain server-side caching, optional GITHUB_TOKEN auth (5000 req/h vs 60),
// rate limiting, and a single point to swap to backend-enhanced data.
const router = require("express").Router();
const { gh } = require("../services/github.service");

router.get("/*", async (req, res, next) => {
  try {
    const upstream = "/" + req.params[0] + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "");
    const data = await gh(upstream);
    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
