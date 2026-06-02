/**
 * Prometheus metrics via prom-client.
 * Falls back gracefully if prom-client is not installed.
 */
let client = null;
try { client = require("prom-client"); } catch { /* optional */ }

let registry, metrics;

if (client) {
  registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry, prefix: "gpa_" });

  metrics = {
    githubApiLatency: new client.Histogram({
      name: "gpa_github_api_duration_seconds",
      help: "GitHub API call duration in seconds",
      labelNames: ["endpoint", "status"],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [registry],
    }),
    aiResponseTime: new client.Histogram({
      name: "gpa_ai_response_duration_seconds",
      help: "AI (OpenAI) response duration in seconds",
      buckets: [0.5, 1, 2, 5, 10, 30],
      registers: [registry],
    }),
    cacheHits: new client.Counter({
      name: "gpa_cache_hits_total",
      help: "Total cache hits",
      registers: [registry],
    }),
    cacheMisses: new client.Counter({
      name: "gpa_cache_misses_total",
      help: "Total cache misses",
      registers: [registry],
    }),
    activeSessions: new client.Gauge({
      name: "gpa_active_sessions",
      help: "Number of active JWT sessions",
      registers: [registry],
    }),
    analyzeRequests: new client.Counter({
      name: "gpa_analyze_requests_total",
      help: "Total analyze requests",
      labelNames: ["status"],
      registers: [registry],
    }),
  };
}

async function getMetricsText() {
  if (!registry) {
    // Fallback plain text metrics
    const mem = process.memoryUsage();
    const uptime = Math.floor(process.uptime());
    return (
      `# HELP gpa_uptime_seconds Uptime in seconds\n# TYPE gpa_uptime_seconds counter\n` +
      `gpa_uptime_seconds ${uptime}\n` +
      `# HELP gpa_memory_rss_bytes Resident set size in bytes\n# TYPE gpa_memory_rss_bytes gauge\n` +
      `gpa_memory_rss_bytes ${mem.rss}\n` +
      `gpa_memory_heap_used_bytes ${mem.heapUsed}\n` +
      `gpa_memory_heap_total_bytes ${mem.heapTotal}\n`
    );
  }
  return registry.metrics();
}

function getContentType() {
  return client ? client.contentType : "text/plain";
}

module.exports = { metrics, getMetricsText, getContentType, registry };
