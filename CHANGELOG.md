# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2024-01

### Added
- **Security**: JWT access tokens now set as `httpOnly`, `Secure`, `SameSite=Strict` cookies — eliminates XSS token theft risk
- **Security**: Account lockout after 5 failed login attempts (15 minute lockout). `423 Locked` response includes `lockedUntil` timestamp
- **Security**: Structured error codes on all API error responses (`code`, `requestId` fields)
- **Observability**: Full Prometheus metrics via `prom-client` at `/api/health/metrics` — tracks GitHub API latency, AI response time, cache hit/miss ratio, active sessions, analyze request count
- **Analysis**: Real README detection via GitHub API for top 6 repos (`/repos/{user}/{repo}/readme`) — replaces the size > 5 byte heuristic
- **Admin**: BullMQ queue dashboard at `GET /admin/queues` — shows job counts (waiting/active/completed/failed/delayed), recent failures, and retry stats per queue
- **Tests**: Unit tests for `computeScore()` covering 9 scenarios (rank boundaries, zero-division safety, pillar behavior)
- **Tests**: Unit tests for `analyzeWithAI()` fallback covering 7 scenarios
- **Tests**: Integration tests for analyze controller (happy path, 404, rate limit, invalid username validation)
- **Tests**: Integration tests for full auth flow (register, login, refresh, logout, expired token rejection)
- **Docs**: Complete OpenAPI 3.0 spec with all endpoints, request/response schemas, and error codes
- **Docs**: `CONTRIBUTING.md` with setup guide, env var reference, test instructions
- **DX**: `CHANGELOG.md` following Keep a Changelog format
- **Routes**: Leaderboard properly mounted at `/api/leaderboard` and `/api/v1/leaderboard`
- **Frontend**: `sessionStorage` replaces `localStorage` for in-memory token fallback — scoped to tab, not persistent
- **Frontend**: Automatic migration of legacy `localStorage` tokens to `sessionStorage` on page load
- **Frontend**: `credentials: "include"` added to fetch calls to leverage httpOnly cookie auth

### Changed
- `analyzeUser` controller: top 6 repos now include `hasReadme: boolean` flag from real GitHub API call
- `analyze()` service now returns `stats.top6WithReadme` count for genuine README data
- Error responses now include `requestId` header value in body for easier log correlation
- `app.js` `logout()` now also calls server `/api/auth/logout` to clear the httpOnly cookie
- Recent searches stored in `sessionStorage` instead of `localStorage`

### Fixed
- Auth controller correctly resets `failedLoginAttempts` and `lockedUntil` on successful login
- Password reset also clears lockout state

## [2.1.0] - 2023-12

### Added
- BullMQ optional job queue with Redis fallback to inline execution
- Weekly digest cron service
- GitHub OAuth flow (`/api/auth/github`)
- Resume upload + AI analysis endpoint
- Export to PDF/CSV/JSON
- Public portfolio page at `/p/:username`
- Embeddable SVG badge at `/api/badge/:username`
- CSRF protection middleware
- Redis-backed rate limiting
- Admin dashboard with real aggregation queries
- OpenAPI spec served at `/api/docs`
- Comprehensive audit logging
- Cache utility with memo/bust helpers

### Changed
- Migrated from simple Express to full domain-structured codebase
- Added httpOnly cookie support alongside Bearer token auth

## [2.0.0] - 2023-10

### Added
- JWT authentication with refresh token rotation
- MongoDB integration (Mongoose)
- Analysis history persistence
- AI recommendations via OpenAI
- Docker + Docker Compose support

## [1.0.0] - 2023-08

### Added
- Initial GitHub portfolio analyzer
- Score computation (activity, quality, impact, diversity, documentation pillars)
- Language breakdown
- Activity heatmap by month
