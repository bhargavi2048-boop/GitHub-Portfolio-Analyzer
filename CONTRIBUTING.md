# Contributing to GitHub Portfolio Analyzer

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Docker + Docker Compose (for MongoDB + Redis)
- A GitHub personal access token (optional, but raises API rate limit from 60 to 5000/h)

### Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd gpa-modified
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start infrastructure (MongoDB + Redis)
docker compose up -d mongo redis

# 4. Start the dev server
npm run dev
```

The app will be available at http://localhost:5000

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: 5000) |
| `MONGODB_URI` | No | MongoDB connection string. Auth/history disabled without it. |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (min 32 chars in production) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `GITHUB_TOKEN` | No | GitHub PAT — raises rate limit from 60 to 5000 req/h |
| `OPENAI_API_KEY` | No | OpenAI API key for AI recommendations |
| `OPENAI_MODEL` | No | Model to use (default: gpt-4o-mini) |
| `REDIS_URL` | No | Redis URL for rate limiting + BullMQ |
| `CORS_ORIGIN` | No | Comma-separated allowed origins (default: *) |
| `APP_URL` | No | Public app URL for email links |
| `SMTP_HOST` | No | SMTP host for email (forgot-password, etc.) |
| `SMTP_PORT` | No | SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From address for emails |
| `NODE_ENV` | No | `development` or `production` |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: 120) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: 60000) |
| `BULL_QUEUES` | No | Comma-separated BullMQ queue names (default: analysis,ai,digest) |

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run a specific test file
npx jest tests/github.service.test.js

# Watch mode
npx jest --watch
```

Coverage target: **80%+**. Check coverage with `npm run test:coverage`.

## Test Files

| File | What it tests |
|---|---|
| `tests/github.service.test.js` | `computeScore()` unit tests — pure function, no mocks needed |
| `tests/ai.service.test.js` | `analyzeWithAI()` fallback logic |
| `tests/analyze.integration.test.js` | Controller integration (requires `nock` for GitHub API mocking) |
| `tests/auth.integration.test.js` | Auth flow: register, login, refresh, logout, token validation |
| `tests/health.test.js` | Health endpoints + CSRF protection |
| `tests/cache.test.js` | Cache memo + bust |

Install `nock` for full integration test coverage:
```bash
npm install --save-dev nock
```

## Spinning Up the Docker Stack

```bash
# Start everything (app + mongo + redis)
npm run docker:up

# View logs
docker compose logs -f app

# Stop
npm run docker:down
```

## Project Structure

```
src/
├── config/         # DB + env config
├── controllers/    # Route handlers (one file per domain)
├── middleware/     # Auth, CSRF, rate limiting, error handling
├── models/         # Mongoose models
├── routes/         # Express routers
├── services/       # Business logic (github, ai, audit, weekly digest)
├── utils/          # Cache, queue, redis, logger, mailer, tokens, metrics
└── docs/           # OpenAPI spec
public/             # Static frontend (index.html, portfolio.html, app.js)
tests/              # Jest test suite
```

## Code Style

```bash
npm run lint          # Check ESLint
npm run lint:fix      # Auto-fix
npm run format        # Prettier
```

## API Documentation

Swagger UI is served at `/api/docs` when the server is running. The full spec is at `/api/docs/openapi.json`.

## Making a PR

1. Fork the repo and create a feature branch
2. Write tests for new functionality
3. Ensure `npm test` passes and coverage stays ≥ 80%
4. Run `npm run lint` and fix any issues
5. Submit a PR with a clear description of the change
