// Serves OpenAPI spec at /api/docs/openapi.json and a minimal Swagger UI at /api/docs
const express = require("express");
const spec = require("../docs/openapi.json");

const router = express.Router();

router.get("/openapi.json", (_req, res) => res.json(spec));

router.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><title>API Docs</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head><body><div id="swagger"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({url:'/api/docs/openapi.json',dom_id:'#swagger'});</script>
</body></html>`);
});

module.exports = router;
