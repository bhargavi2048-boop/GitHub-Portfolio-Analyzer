# v2.1.0 — Production Upgrade Notes

UI is unchanged. All additions are backend / DevOps / DX. Existing endpoints,
routes, controllers, and the `public/` frontend are preserved byte-for-byte
(except `src/server.js`, which is a strict superset of the previous version).

## What was added

### Performance & scalability
- **Two-tier cache** (`src/utils/cache.js`): Redis-backed via `ioredis` with
  in-memory `node-cache` fallback. Same `memo()/bust()` API — drop-in.
- **Background queue** (`src/utils/queue.js`): BullMQ when Redis is available,
  inline execution otherwise. `register(name, handler)` + `enqueue(name, data)`.
- **Rate-limit Redis store** wired automatically when Redis is present.

### DevOps
- `Dockerfile` (multi-stage, non-root, healthcheck)
- `docker-compose.yml` (app + mongo + redis with volumes)
- `.dockerignore`
- `.github/workflows/ci.yml` (lint, test, docker build with cache)

### Observability
- Structured JSON logger with levels & child bindings (`src/utils/logger.js`)
- Request-ID middleware (echoed in `x-request-id`)
- `/api/health`, `/api/health/live`, `/api/health/ready`, `/api/health/metrics`
  (Prometheus-text format)

### Security hardening
- Extra security headers middleware (Permissions-Policy, COOP, CORP, etc.)
- Double-submit **CSRF** protection (bypassed for Bearer-token APIs and
  `/api/public/webhooks/*`)
- Cookie-based access token support alongside Authorization header
- Role-based access control (`requireRole("admin")`)
- **Audit log** model + service + middleware (writes to `audit_logs` collection)
- **Session** model with TTL index for tracked refresh-token sessions
- Stricter helmet HSTS in production, `x-powered-by` disabled

### API & versioning
- All routes also mounted under `/api/v1/*` (legacy `/api/*` still works)
- **OpenAPI 3** spec at `/api/docs/openapi.json` + Swagger UI at `/api/docs`
- **Admin** dashboard endpoints under `/api/admin/*` (stats, audits, api-usage)

### Backend quality
- Centralized env validation (`src/config/env.js`) with defaults & prod hard-fail
- Graceful shutdown on SIGTERM/SIGINT
- AI-specific rate limiter on `/api/ai/*`

### Testing & DX
- Jest + supertest with `npm test` and `npm run test:coverage`
- ESLint + Prettier with `npm run lint` / `npm run format`
- `optionalDependencies` for ioredis/bullmq/rate-limit-redis — install only if used

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

With Docker:

```bash
docker compose up -d
```

## Notes
- Redis/BullMQ are **optional**. Without `REDIS_URL`, cache falls back to memory
  and queues run inline — no code changes required.
- The static `public/` SPA and every existing controller/route are untouched,
  so the UI and existing behavior are 100% preserved.
