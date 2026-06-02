// Structured JSON logger with request-id support and level filtering.
const isProd = process.env.NODE_ENV === "production";
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN = LEVELS[(process.env.LOG_LEVEL || "info").toLowerCase()] || LEVELS.info;

function emit(level, msg, meta) {
  if (LEVELS[level] < MIN) return;
  if (isProd) {
    process.stdout.write(JSON.stringify({
      t: new Date().toISOString(), level, msg, ...(meta || {}),
    }) + "\n");
    return;
  }
  const tag = {
    info: "\x1b[36mINFO\x1b[0m", warn: "\x1b[33mWARN\x1b[0m",
    error: "\x1b[31mERR \x1b[0m", debug: "\x1b[90mDBG \x1b[0m",
  }[level] || level;
  // eslint-disable-next-line no-console
  console.log(`${tag} ${msg}${meta ? " " + JSON.stringify(meta) : ""}`);
}

function child(bindings) {
  return {
    info: (m, x) => emit("info", m, { ...bindings, ...(x || {}) }),
    warn: (m, x) => emit("warn", m, { ...bindings, ...(x || {}) }),
    error: (m, x) => emit("error", m, { ...bindings, ...(x || {}) }),
    debug: (m, x) => emit("debug", m, { ...bindings, ...(x || {}) }),
    child: (more) => child({ ...bindings, ...more }),
  };
}

module.exports = {
  info: (m, x) => emit("info", m, x),
  warn: (m, x) => emit("warn", m, x),
  error: (m, x) => emit("error", m, x),
  debug: (m, x) => emit("debug", m, x),
  child,
};
