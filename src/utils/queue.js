// Optional BullMQ-based background queue. Falls back to inline execution
// when bullmq/ioredis are absent. Public API: enqueue(name, payload, opts).
const logger = require("./logger");
const { getRedis } = require("./redis");

let Queue, Worker;
try { ({ Queue, Worker } = require("bullmq")); } catch { /* optional */ }

const queues = new Map();
const handlers = new Map();

function getQueue(name) {
  if (!Queue) return null;
  const conn = getRedis();
  if (!conn) return null;
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: conn }));
    if (handlers.has(name)) startWorker(name);
  }
  return queues.get(name);
}

function startWorker(name) {
  if (!Worker) return;
  const conn = getRedis();
  if (!conn) return;
  const handler = handlers.get(name);
  const w = new Worker(name, async (job) => handler(job.data), {
    connection: conn, concurrency: Number(process.env.QUEUE_CONCURRENCY || 4),
  });
  w.on("failed", (j, err) => logger.error("job failed", { name, id: j?.id, msg: err?.message }));
  w.on("completed", (j) => logger.debug("job done", { name, id: j.id }));
}

function register(name, handler) {
  handlers.set(name, handler);
  if (Queue) startWorker(name);
}

async function enqueue(name, payload, opts = {}) {
  const q = getQueue(name);
  if (q) return q.add(name, payload, { removeOnComplete: 1000, removeOnFail: 5000, ...opts });
  // Fallback: inline (best effort)
  const handler = handlers.get(name);
  if (handler) {
    setImmediate(() => Promise.resolve(handler(payload)).catch((e) =>
      logger.error("inline job failed", { name, msg: e.message })));
  }
  return null;
}

module.exports = { enqueue, register, getQueue };
