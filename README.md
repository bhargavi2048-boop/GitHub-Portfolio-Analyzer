<div align="center">

# 🚀 GitHub Portfolio Analyzer

### *Transform Your Repositories into Recruiter-Ready Proof*

> "Your code speaks louder than words — turn your GitHub into your best resume."

[![Node.js CI](https://img.shields.io/github/actions/workflow/status/your-org/github-portfolio-analyzer/ci.yml?label=CI&logo=github&style=flat-square)](https://github.com/your-org/github-portfolio-analyzer/actions)
[![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen?style=flat-square)](./tests)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![OpenAPI](https://img.shields.io/badge/docs-OpenAPI%203.0-6BA539?style=flat-square&logo=swagger)](http://localhost:5000/api/docs)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](./CONTRIBUTING.md)
[![Version](https://img.shields.io/badge/version-2.2.0-teal?style=flat-square)](./CHANGELOG.md)

<br/>


<br/>

Demo Link: "https://github-portfolio-analyzer-r0zy.onrender.com"

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Enterprise Features](#-enterprise-features-9-ai-powered-panels)
- [UI & UX Features](#-ui--ux-features)
- [Auth & Account System](#-auth--account-system)
- [Admin & Observability](#-admin--observability)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Embed a Badge](#-embed-a-badge)
- [Project Structure](#-project-structure)
- [Running Tests](#-running-tests)
- [Docker](#-docker)
- [Score Methodology](#-score-methodology)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**GitHub Portfolio Analyzer** is a production-grade, full-stack SaaS application that evaluates GitHub profiles and generates detailed, recruiter-ready portfolio scores. It fetches public repository data from the GitHub API, runs a five-pillar scoring algorithm, and layers on nine AI-powered enterprise analysis panels — all without requiring GitHub login or access to private data.

Built for **students, developers, and job seekers** who want to understand exactly how a technical recruiter reads their GitHub profile, and get actionable steps to improve it.

**How it works in 10 seconds:**

1. Enter any GitHub username or paste a profile URL
2. The engine fetches repos, activity, languages, stars, documentation, and community signals
3. Returns a 0–100 score with S–D rank, ATS compatibility score, strengths, weaknesses, and nine enterprise analysis panels
4. Export an HTML/JSON report — or share a live public portfolio link

---

## ✨ Core Features

### Portfolio Scoring Engine

| Feature | Description |
|---|---|
| **5-Pillar Score** | Activity · Quality · Impact · Diversity · Documentation — weighted into a 0–100 composite |
| **S–D Rank System** | Letter-grade ranking (S / A / B / C / D) matching recruiter shortlisting thresholds |
| **ATS Score** | Separate ATS compatibility score measuring bio completeness, pinned repos, profile fields, README coverage, and topic usage |
| **Real README Detection** | Calls GitHub's `/repos/{user}/{repo}/readme` API for the top 6 repos — not a file-size heuristic |
| **Language Distribution** | Visual bar chart of language breakdown across all non-fork repositories |
| **Top Repositories Panel** | Sorted by stars + forks; shows language, star count, fork count, description |
| **Profile Details** | Location, company, website, account age, gists, account type — displayed in the details panel |

### Activity & Gamification

| Feature | Description |
|---|---|
| **Contribution Heatmap** | 12-month repository-update heatmap with 5 intensity levels |
| **Developer Rank & XP** | XP system with named rank titles: Rookie → Junior → Mid → Senior → Staff → Principal → Fellow |
| **Achievement Badges** | Unlockable milestone badges — Star Collector, Polyglot, Open Sourcer, Documentation Hero, Consistent Committer, and more |
| **Visual Analytics** | Language pie chart, 6-metric skill radar, and monthly activity bar chart powered by Chart.js |

### AI & Recommendations

| Feature | Description |
|---|---|
| **AI Portfolio Insights** | GPT-4o-mini analysis of strengths, weaknesses, recruiter impression, top detected skills, and build-next project ideas. Graceful deterministic fallback when no API key is set |
| **Recruiter Impression Panel** | AI-generated "recruiter first impression" paragraph with developer level badge |
| **AI Skill Gap Detector** | Select a target role and get personalised missing skills, project ideas, and next steps |
| **Resume AI Analysis** | Upload a PDF resume (up to 5 MB). Extracts skills from 80+ keyword dictionary, runs ATS scoring, flags missing sections, and compares against your GitHub languages |

### Discovery & Comparison

| Feature | Description |
|---|---|
| **Profile Comparison** | Side-by-side comparison of two profiles with score diff and pillar breakdown |
| **Multi-Profile Comparison** | Add a third profile (Username C) and render a radar chart comparing all three simultaneously |
| **Trending Developers** | Browse top GitHub developers filtered by language and/or location |
| **Popular Profiles** | Curated list of 10 well-known developers to explore and benchmark against |
| **User Search** | Real-time GitHub user search via the GitHub search API |
| **URL Auto-Analyze** | Append `?u=username` or `?username=username` to the URL — the profile analyzes automatically |

### Sharing & Export

| Feature | Description |
|---|---|
| **Copy Share Link** | One-click copy of a shareable URL for any analyzed profile |
| **Public Portfolio Page** | Shareable read-only page at `/p/:username` |
| **LinkedIn Summary Generator** | AI-formatted professional summary ready to paste into LinkedIn |
| **Recruiter Profile Text** | Formatted one-pager text for cold outreach or application cover |
| **Embed Card** | Copyable iframe/HTML embed card for personal websites |
| **QR Code Generator** | QR code for your portfolio URL |
| **Download JSON** | Full analysis data as a structured JSON file |
| **Markdown Report** | Download a formatted Markdown portfolio report |
| **Print / Save HTML** | One-click HTML snapshot of the full analysis for offline use |
| **PDF Export** | Server-side PDF report generated by PDFKit via `/api/export/:username.pdf` |

---

## 🏢 Enterprise Features — 9 AI-Powered Panels

All nine panels activate automatically after every profile scan. They render progressively (staggered 600–1800 ms) to avoid layout jank and use deterministic heuristics so they work with no OpenAI key.

---

### 1. 🤖 AI Project Quality Judge

Scores each of your top 6 repositories across **8 weighted quality dimensions**:

| Dimension | Weight | Primary Signals |
|---|---|---|
| Project Idea | 1.2× | Description clarity, topics, homepage |
| Implementation | 1.5× | Codebase size, forks, language depth |
| Documentation | 1.3× | Description, homepage URL, license |
| Scalability | 1.0× | Fork count, license, community signals |
| Maintainability | 1.0× | Days since last update, license |
| Real-World Relevance | 1.2× | Stars, topic tags |
| Code Organization | 1.0× | Topics, codebase size |
| Portfolio Value | 1.3× | Live demo, community traction |

Each repo gets an **overall score out of 100** displayed as a circular badge, plus up to 3 AI-generated improvement suggestions.

---

### 2. 🔍 Repository Deep Analysis

Per-repository audit covering:
- Folder structure quality (inferred from size, language, topics)
- Naming convention check (kebab-case validation)
- Architecture clarity and separation of concerns
- Technical debt signals (stale repos, missing metadata)
- Maintainability and community signals (stars, forks, recency)

Each repo card shows a colour-coded quality score with Strengths / Weaknesses / Suggestions.

---

### 3. 📄 README Analyzer

Evaluates each repository's README completeness across **9 weighted sections**:

| Section | Points |
|---|---|
| Project Description | 15 |
| Installation Guide | 14 |
| Features Section | 12 |
| Usage Instructions | 12 |
| Contributing Guide | 10 |
| Screenshots / Demo GIF | 10 |
| Live Demo Link | 10 |
| License | 9 |
| Architecture Diagram | 8 |

Renders pass/fail badges per section and highlights missing sections with their point values so you know exactly where to focus.

---

### 4. 💪 Portfolio Strength Analyzer

Category-based strength scores (0–100) across 8 developer disciplines:

- 🎨 Frontend Development
- ⚙️ Backend Development
- 🔗 Full Stack Development
- 🤖 AI / Machine Learning
- 🐳 DevOps
- 🌐 Open Source Contributions
- 📖 Documentation
- 🧩 Problem Solving

Returns top strength areas, improvement areas, and a skill-distribution insight paragraph.

---

### 5. 🏗️ Architecture Detection Engine

Automatically detects the predominant software architecture pattern across your repositories:

`Microservices` · `MVC` · `Clean Architecture` · `Event-Driven` · `Layered` · `Modular` · `Monolithic`

Infers patterns from repository names, topics, and descriptions. Returns detected pattern with confidence level, architecture strengths, weaknesses, and improvement suggestions.

---

### 6. 📅 Contribution Consistency Analysis

Analyses 12-month GitHub activity to produce:
- Consistency score (0–100)
- Total commits and monthly average
- Active vs inactive period breakdown
- Trend direction — Increasing 📈 / Stable ➡️ / Decreasing 📉
- AI-generated productivity insights and habit-building recommendations

---

### 7. 🌍 Open Source Readiness Score

Evaluates repositories for community-adoption readiness across 7 checkpoints:

```
✓ LICENSE file present          ✓ Repository descriptions
✓ Topics & discoverability      ✓ README documentation
✓ Community traction (forks)    ✓ Live demo / homepage
✓ Public profile complete
```

Returns a 0–100 readiness score with pass/fail per checkpoint and a ranked list of adoption suggestions.

---

### 8. 📈 GitHub Growth Timeline

Builds a developer evolution timeline by dividing repository history into three phases:

```
🌱 Learning Stage  →  🔧 Intermediate Stage  →  🚀 Advanced Stage
```

Each phase shows repo count, languages used, focus areas, date range, and a narrative observation about the developer's growth trajectory.

---

### 9. 📋 Professional Export Report

Generates a complete enterprise-grade portfolio report in three formats:

| Format | Contents |
|---|---|
| **📄 Full HTML Report** | All 9 panels, score breakdowns, repo cards, language bars, styled for sharing or attaching to applications |
| **🖨️ Print Report** | Print-optimised version of the HTML report |
| **📦 JSON Bundle** | Structured data export with `meta`, `profile`, `scores`, `languages`, `strengths`, `improvements`, `repositories` |

---

## 🎨 UI & UX Features

| Feature | Description |
|---|---|
| **Dark Mode** | Full dark theme toggle with `localStorage` persistence across sessions |
| **Skeleton Loading** | Skeleton screen animation during analysis instead of a blank loading state |
| **Animated Score Ring** | SVG ring animates from 0 to the final score on load |
| **Animated Counters** | Stat numbers (repos, stars, followers) animate up from zero |
| **Scroll Reveal** | Sections animate in as they enter the viewport (IntersectionObserver) |
| **Particle Background** | Subtle animated canvas particles on the hero background |
| **Keyboard Shortcuts** | `?` FAB button opens a modal listing all available keyboard shortcuts |
| **Mobile Bottom Nav** | Fixed bottom navigation bar on mobile for quick section jumping |
| **Recent Searches** | Last 5 searched usernames stored in `sessionStorage` as clickable chips |
| **Onboarding Tour** | 5-step guided tour for first-time visitors explaining each panel |
| **Score Methodology Modal** | `?` button on the score card opens a detailed breakdown of how the score is calculated |
| **Privacy Modal** | Full privacy policy modal explaining what data is read and what is stored |
| **Privacy Banner** | One-time dismissable banner explaining the tool reads only public GitHub data |
| **Repo Search & Filter** | Client-side search and sort (stars, forks, updated) across all repositories |
| **Show All Repos Toggle** | Checkbox to expand from top 6 to all analyzed repositories |
| **Repo Deep-Dive Modal** | Click any repo card to open a modal with: language breakdown bars, top 3 contributors, last commit date, open issue count, and README preview |
| **Language Color Dots** | Colour-coded language dots matching GitHub's official language colour palette |
| **Copy Buttons** | One-click copy buttons on all code blocks, badge embeds, and text output |
| **Toast Notifications** | Non-intrusive success / error / warning / info toasts with auto-dismiss |
| **URL Parameter Analysis** | `?u=username` in the URL auto-triggers analysis on page load |
| **Live Profile Preview** | Real-time preview of a GitHub avatar and name while typing in the input |
| **Quick Tips FAB** | Floating action button with contextual improvement tips |
| **Trending Panel** | Side panel showing trending developers — filterable by language and location |
| **Multi-stage Loading Progress** | Labelled loading stages: Fetching profile → Loading repositories → Analyzing → Building report |
| **Responsive Layout** | Fully mobile-responsive with CSS breakpoints at 640 px, 700 px, and 900 px |
| **Input Validation** | Client-side GitHub username validation with inline error messages |
| **Compare Radar Chart** | Radar chart rendering when 3 profiles are compared simultaneously |
| **Print / Save HTML** | Saves the full analysis as a standalone HTML file for offline sharing |
| **Accessibility (A11y)** | ARIA labels on all interactive controls, `lang="en"` on `<html>`, keyboard-navigable modals |

---

## 🔐 Auth & Account System

| Feature | Description |
|---|---|
| **Email / Password Register** | Standard registration with name, email, and password (min 8 chars) |
| **Email Verification** | Verification token emailed on registration; account flagged `emailVerified` on click |
| **Login with httpOnly Cookie** | JWT access token set as `httpOnly`, `Secure`, `SameSite=Strict` cookie — eliminates XSS token theft |
| **Refresh Token Rotation** | Separate refresh token with 30-day TTL; rotated on every refresh call |
| **Account Lockout** | 5 consecutive failed login attempts triggers a 15-minute lockout; `423 Locked` response includes `lockedUntil` timestamp |
| **Forgot Password** | Token emailed with a 1-hour expiry; `POST /auth/forgot-password` |
| **Password Reset** | `POST /auth/reset-password` — validates token, hashes new password |
| **GitHub OAuth** | "Continue with GitHub" login flow via `GET /auth/github`; creates or links account on callback |
| **`GET /auth/me`** | Returns authenticated user profile: email, name, role, avatar, `emailVerified`, `weeklyDigest` flag |
| **Weekly Digest Opt-in** | `PATCH /auth/me/digest` toggles the `weeklyDigest` boolean on the user record |
| **Weekly Digest Emails** | Cron job runs every Monday 08:00 UTC; re-analyzes saved usernames and emails score-change summary |
| **Role-Based Access** | `user` and `admin` roles; `requireRole("admin")` middleware guards admin endpoints |
| **Analysis History** | Every analysis run is stored in `HistoryEntry` (when authenticated); `GET /api/history` returns paginated history |
| **Saved Reports** | `POST /api/reports` saves a full analysis snapshot; `GET /api/reports/mine` lists; `DELETE /api/reports/:id` removes |
| **Resume History** | `GET /api/resume/history` returns past resume analyses for the authenticated user |
| **In-memory Token Fallback** | `sessionStorage` used as fallback for tab-scoped token storage; legacy `localStorage` tokens auto-migrated |
| **Structured Error Codes** | All API errors include `code`, `requestId` fields for programmatic handling |

---

## 🛡️ Admin & Observability

| Feature | Description |
|---|---|
| **Admin Dashboard** | `GET /api/admin/dashboard` — aggregate stats: total users, sessions, audits |
| **BullMQ Queue Dashboard** | `GET /api/admin/queues` — job counts (waiting / active / completed / failed / delayed), recent failures, retry stats |
| **Audit Log** | Every API request is logged to `AuditLog` collection; `GET /api/admin/audits` returns paginated entries |
| **API Usage Stats** | `GET /api/admin/api-usage` — aggregated action counts from the audit log |
| **Prometheus Metrics** | Full `prom-client` metrics at `GET /api/health/metrics`: GitHub API latency histogram, AI response time, cache hit/miss counters, active session gauge, analyze request counter |
| **Health Check** | `GET /api/health` — returns status, version, uptime, MongoDB readiness |
| **Swagger UI** | Interactive OpenAPI 3.0 documentation at `GET /api/docs` |
| **OpenAPI Spec** | Raw JSON spec at `GET /api/docs/openapi.json` |
| **Request IDs** | Every request tagged with a UUID `x-request-id` header for tracing |
| **Structured Logging** | Winston-based logger with `requestId` correlation in every log line |
| **Security Headers** | Helmet, custom `securityHeaders` middleware, HSTS in production |
| **CSRF Protection** | Double-submit cookie pattern on all state-changing endpoints |

---

## 🛠 Tech Stack

**Backend**

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (httpOnly cookies) · bcryptjs · refresh token rotation |
| AI | OpenAI GPT-4o-mini (optional; deterministic fallback built in) |
| Queue | BullMQ + Redis (optional) |
| Email | Nodemailer + node-cron weekly digest |
| File Upload | Multer (PDF resume, 5 MB limit) |
| PDF | PDFKit (export) · pdf-parse (resume extraction) |
| Metrics | prom-client (Prometheus) |
| Caching | node-cache (in-memory, 5-min TTL) + optional Redis |
| Validation | express-validator |
| Security | Helmet · cors · express-rate-limit · CSRF · audit logging |

**Frontend**

| Layer | Technology |
|---|---|
| UI | Vanilla JS + CSS custom properties — zero build step |
| Charts | Chart.js 4.4 (pie, radar, bar) |
| Architecture | Progressive enhancement; `app.js` transparently proxies GitHub API calls through the backend |
| Dark Mode | CSS `[data-theme]` + `localStorage` persistence |
| Mobile | Custom bottom navigation, CSS breakpoints at 640/700/900 px |
| Accessibility | ARIA labels, keyboard navigation, IntersectionObserver reveal animations |

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** — required for auth, history, and saved reports (local or Atlas)
- **Redis** — optional; enables BullMQ job queues and Redis-backed rate limiting

> The app runs fully **without MongoDB, Redis, and OpenAI**. It falls back to in-memory caching, deterministic heuristics for AI features, and disables auth/history endpoints.

### 1. Clone & Install

```bash
git clone https://github.com/your-org/github-portfolio-analyzer.git
cd github-portfolio-analyzer
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` — minimum required values:

```env
# Required
JWT_SECRET=your-32-byte-minimum-secret-here
JWT_REFRESH_SECRET=another-32-byte-secret-here

# Optional but strongly recommended
MONGODB_URI=mongodb://localhost:27017/gpa
GITHUB_TOKEN=ghp_your_token_here       # 60 → 5,000 req/h rate limit
OPENAI_API_KEY=sk-...                  # Real AI recommendations
```

### 3. Start with Docker (recommended)

```bash
# Starts MongoDB + Redis + app on port 5000
npm run docker:up
```

### 4. Start without Docker

```bash
# Ensure MongoDB is running locally first
mongod --dbpath /data/db

npm run dev
```

Open **http://localhost:5000** — enter any GitHub username and click **Analyze Profile**.

---

## ⚙️ Configuration

Full reference in [`.env.example`](./.env.example).

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | ✅ | — | Access token signing secret (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh token signing secret (≥ 32 chars) |
| `JWT_ACCESS_TTL` | ➕ | `15m` | Access token expiry |
| `JWT_REFRESH_TTL` | ➕ | `30d` | Refresh token expiry |
| `MONGODB_URI` | ⚠️ | — | MongoDB connection string. Auth/history disabled without it |
| `GITHUB_TOKEN` | ➕ | — | Personal access token — raises rate limit 60 → 5,000 req/h |
| `OPENAI_API_KEY` | ➕ | — | Enables GPT-4o-mini AI recommendations |
| `OPENAI_MODEL` | ➕ | `gpt-4o-mini` | Override the OpenAI model |
| `PORT` | ➕ | `5000` | HTTP server port |
| `NODE_ENV` | ➕ | `development` | `production` enables HSTS and combined Morgan logs |
| `CORS_ORIGIN` | ➕ | `*` | Allowed CORS origins (comma-separated) |
| `APP_URL` | ➕ | — | Used in password-reset and email-verification links |
| `REDIS_URL` | ➕ | — | Redis connection URL for BullMQ + rate limiting |
| `GITHUB_CLIENT_ID` | ➕ | — | GitHub OAuth app Client ID |
| `GITHUB_CLIENT_SECRET` | ➕ | — | GitHub OAuth app Client Secret |
| `GITHUB_CALLBACK_URL` | ➕ | auto-detected | GitHub OAuth callback URL |
| `SMTP_HOST` | ➕ | — | SMTP host for verification and digest emails |
| `SMTP_PORT` | ➕ | `587` | SMTP port |
| `SMTP_USER` | ➕ | — | SMTP username |
| `SMTP_PASS` | ➕ | — | SMTP password |
| `SMTP_FROM` | ➕ | — | From address for outgoing emails |
| `LOG_LEVEL` | ➕ | `info` | Winston log level |
| `SENTRY_DSN` | ➕ | — | Sentry DSN for error tracking |

---

## 📡 API Reference

Base URL: `http://localhost:5000/api` (also mounted at `/api/v1` for versioned access)

### Analysis

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/analyze?username=` | Optional | Full portfolio analysis |
| `POST` | `/analyze` | Optional | Same via POST body |
| `GET` | `/analyze/compare?a=&b=` | — | Side-by-side comparison |
| `GET` | `/analyze/:username/repo/:repo` | — | Deep-dive stats for one repo |

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/ai` | — | AI feedback for a pre-fetched analysis payload |
| `POST` | `/ai/skillgap` | — | Skill gap analysis for a target role |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account (sends verification email) |
| `POST` | `/auth/login` | Login — sets httpOnly JWT cookie |
| `POST` | `/auth/logout` | Clears session cookie |
| `POST` | `/auth/refresh` | Rotate access token using refresh token |
| `GET` | `/auth/me` | Authenticated user profile |
| `PATCH` | `/auth/me/digest` | Toggle weekly digest opt-in |
| `POST` | `/auth/forgot-password` | Send password-reset email |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/auth/verify-email` | Verify email address from link |
| `GET` | `/auth/github` | Initiate GitHub OAuth |
| `GET` | `/auth/github/callback` | GitHub OAuth callback |

### Export & Sharing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/export/:username.pdf` | Server-side PDF portfolio report |
| `GET` | `/badge/:username.svg` | Embeddable SVG score badge (1-hour cache) |
| `GET` | `/public/:username` | Lean public profile snapshot (no auth) |

### Discovery

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/discover/search?q=` | GitHub user search |
| `GET` | `/discover/trending?language=&location=` | Trending developers |
| `GET` | `/discover/popular` | Curated popular profiles |

### Platform

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/leaderboard` | — | Top 50 profiles by score |
| `POST` | `/reports` | Optional | Save an analysis snapshot |
| `GET` | `/reports/mine` | ✅ | List saved reports |
| `GET` | `/reports/:id` | Optional | Get one report (public or owned) |
| `DELETE` | `/reports/:id` | ✅ | Delete a report |
| `GET` | `/history` | ✅ | Analysis history |
| `POST` | `/resume` | Optional | Upload PDF resume for analysis |
| `GET` | `/resume/history` | ✅ | Past resume analyses |

### Admin (role: admin)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/dashboard` | Aggregate platform stats |
| `GET` | `/admin/queues` | BullMQ queue dashboard |
| `GET` | `/admin/audits` | Audit log entries |
| `GET` | `/admin/api-usage` | API action frequency report |
| `GET` | `/admin/stats` | Legacy stats endpoint |

### Health & Docs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/health/metrics` | Prometheus metrics |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/docs/openapi.json` | Raw OpenAPI 3.0 spec |

---

## 🏷️ Embed a Badge

Add a live score badge to your own GitHub README:

```markdown
[![Portfolio Score](https://your-domain.com/api/badge/your-username.svg)](https://your-domain.com)
```

The badge displays your S–D rank and score out of 100 and updates every time your profile is analyzed (1-hour server cache).

**Embed card** — a full HTML card for personal websites is available via the **Embed Card** button after analyzing any profile.

---

## 📁 Project Structure

```
github-portfolio-analyzer/
├── public/
│   ├── index.html                  # Main SPA — all UI, charts, enterprise panels (7,000+ lines)
│   ├── enterprise-features.js      # 9 enterprise AI analysis modules (1,200+ lines)
│   ├── app.js                      # Backend bridge — fetch proxy, in-memory token, SDK surface
│   ├── portfolio.html              # Public portfolio share page (/p/:username)
│   └── leaderboard.html            # Public leaderboard page (/leaderboard)
│
├── src/
│   ├── server.js                   # Express app — middleware stack, route mounting
│   ├── config/
│   │   ├── db.js                   # MongoDB connection with graceful degradation
│   │   └── env.js                  # Required/optional env var validation on startup
│   │
│   ├── controllers/
│   │   ├── analyze.controller.js   # Portfolio analysis, comparison, repo deep-dive
│   │   ├── ai.controller.js        # AI feedback endpoint + skill gap analysis
│   │   ├── auth.controller.js      # Register, login, refresh, lockout, password reset, email verify
│   │   ├── oauth.controller.js     # GitHub OAuth start + callback
│   │   ├── export.controller.js    # PDFKit PDF report generation
│   │   ├── resume.controller.js    # PDF resume upload, skill extraction, ATS scoring
│   │   ├── report.controller.js    # Saved report CRUD
│   │   ├── badge.controller.js     # SVG badge generation with rank colours
│   │   ├── discover.controller.js  # User search, trending, popular profiles
│   │   ├── leaderboard.controller.js
│   │   ├── history.controller.js
│   │   ├── public.controller.js    # Lean public profile snapshot
│   │   └── admin.controller.js     # Dashboard, queue stats, audit log
│   │
│   ├── services/
│   │   ├── github.service.js       # GitHub API client, 5-pillar scoring engine, node-cache
│   │   ├── ai.service.js           # OpenAI integration with deterministic fallback
│   │   ├── audit.service.js        # Request audit log middleware
│   │   └── weeklyDigest.service.js # Monday 08:00 UTC cron — score-change digest emails
│   │
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js                 # Email, password (bcrypt), GitHub OAuth fields, lockout, digest flag
│   │   ├── Session.js
│   │   ├── RefreshToken.js
│   │   ├── Report.js               # Saved analysis snapshots (public/private)
│   │   ├── ResumeAnalysis.js
│   │   ├── HistoryEntry.js
│   │   ├── Leaderboard.js
│   │   └── AuditLog.js
│   │
│   ├── routes/                     # Express routers — one file per feature area
│   │   ├── analyze.routes.js       # Validation + rate limiting
│   │   ├── auth.routes.js
│   │   ├── ai.routes.js
│   │   ├── export.routes.js
│   │   ├── resume.routes.js
│   │   ├── badge.routes.js
│   │   ├── discover.routes.js
│   │   ├── report.routes.js
│   │   ├── history.routes.js
│   │   ├── leaderboard.routes.js
│   │   ├── public.routes.js
│   │   ├── admin.routes.js
│   │   ├── githubProxy.routes.js
│   │   ├── health.routes.js
│   │   └── docs.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.js                 # requireAuth, optionalAuth, requireRole
│   │   ├── csrf.js                 # Double-submit CSRF token issuer + verifier
│   │   ├── rateLimit.js            # apiLimiter, authLimiter, aiLimiter, uploadLimiter
│   │   ├── errorHandler.js         # Structured error responses with requestId
│   │   ├── requestId.js            # UUID x-request-id on every request
│   │   └── securityHeaders.js      # Custom security headers beyond Helmet defaults
│   │
│   ├── utils/
│   │   ├── logger.js               # Winston structured logger
│   │   ├── cache.js                # Memo helper wrapping node-cache
│   │   ├── mailer.js               # Nodemailer send wrapper
│   │   ├── metrics.js              # prom-client metric definitions
│   │   ├── queue.js                # BullMQ queue factory (optional)
│   │   ├── redis.js                # Redis client with graceful fallback
│   │   ├── tokens.js               # JWT sign / verify helpers
│   │   └── validate.js             # express-validator error collector
│   │
│   └── docs/
│       └── openapi.json            # Complete OpenAPI 3.0 spec
│
├── tests/
│   ├── health.test.js              # Health endpoint smoke tests
│   ├── github.service.test.js      # Scoring algorithm unit tests (9 scenarios)
│   ├── ai.service.test.js          # AI service with mocked OpenAI (7 scenarios)
│   ├── analyze.integration.test.js # Full analysis flow — nocked GitHub API
│   ├── auth.integration.test.js    # Register / login / refresh / lockout flows
│   ├── cache.test.js               # Cache TTL and invalidation
│   └── env.test.js                 # Environment validation
│
├── .github/workflows/ci.yml        # GitHub Actions: lint → test → coverage
├── docker-compose.yml              # MongoDB + Redis + app (three services)
├── Dockerfile
├── jest.config.js
├── .env.example                    # All variables documented with explanations
├── CHANGELOG.md                    # Keep a Changelog format
├── CONTRIBUTING.md                 # Setup guide, env reference, PR workflow
└── setup.js                        # Interactive first-run setup wizard
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage

# Lint
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format with Prettier
npm run format
```

**Test coverage areas:**

| File | What it covers |
|---|---|
| `health.test.js` | Health endpoint smoke tests |
| `github.service.test.js` | `computeScore()` — 9 scenarios covering rank boundaries, zero-division safety, pillar behaviour |
| `ai.service.test.js` | `analyzeWithAI()` with mocked OpenAI — 7 scenarios including fallback |
| `analyze.integration.test.js` | Full analysis flow with nocked GitHub API; 404 handling, rate limit, invalid username |
| `auth.integration.test.js` | Register, login, token refresh, logout, expired-token rejection, lockout |
| `cache.test.js` | TTL expiry and cache invalidation |
| `env.test.js` | Required vs optional env var validation |

---

## 🐳 Docker

```bash
# Build and start all three services
npm run docker:up

# Stop everything
npm run docker:down

# Build image only
npm run docker:build
```

Services started by `docker-compose.yml`:

| Service | Port | Purpose |
|---|---|---|
| `app` | 5000 | Express server |
| `mongo` | 27017 | MongoDB with persistent named volume |
| `redis` | 6379 | BullMQ queues + Redis rate limiting |

---

## 📊 Score Methodology

The overall portfolio score (0–100) is a weighted combination of five pillars:

| Pillar | Weight | What it measures |
|---|---|---|
| **Activity** | 25% | Push frequency over 12 months + total repo count |
| **Impact** | 25% | Stars and followers — community recognition |
| **Quality** | 20% | License presence, topic tags — production-readiness signals |
| **Documentation** | 15% | README presence across repos + bio completeness |
| **Diversity** | 15% | Language breadth across the portfolio |

**Score bands:**

| Score | Rank | Meaning |
|---|---|---|
| 85–100 | S | Exceptional — recruiter-ready |
| 70–84 | A | Strong — minor polish needed |
| 55–69 | B | Good foundation — targeted improvements help |
| 40–54 | C | Room to grow |
| 0–39 | D | Early stage — start with READMEs |

> Scores are heuristic-based and run server-side via the GitHub public API. They are not affiliated with GitHub, Inc.

---

## 🤝 Contributing

Contributions are very welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

**Quick contributor flow:**

```bash
# 1. Fork and clone
git clone https://github.com/your-username/github-portfolio-analyzer.git
cd github-portfolio-analyzer

# 2. Install and configure
npm install
cp .env.example .env   # fill in JWT_SECRET and JWT_REFRESH_SECRET at minimum

# 3. Create a feature branch
git checkout -b feat/your-feature-name

# 4. Make changes and add tests

# 5. Lint and test
npm run lint && npm test

# 6. Push and open a Pull Request
git push origin feat/your-feature-name
```

- **Bug reports** — open an issue with steps to reproduce, expected vs actual behaviour, and your Node.js version
- **Feature requests** — open an issue tagged `enhancement` with a clear use-case description
- **Security issues** — do not open a public issue; email the maintainer directly

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgements

- [GitHub REST API](https://docs.github.com/en/rest) — all repository and profile data
- [Chart.js](https://www.chartjs.org/) — visual analytics (pie, radar, bar charts)
- [OpenAI](https://openai.com/) — AI-powered recommendations (optional)
- [PDFKit](https://pdfkit.org/) — server-side PDF report generation
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) — resume text extraction
- [BullMQ](https://docs.bullmq.io/) — job queue for background tasks
- [prom-client](https://github.com/siimon/prom-client) — Prometheus metrics
- [Shields.io](https://shields.io/) — README badges

---

<div align="center">

Made with ❤️ for developers who want their GitHub to work as hard as they do.

**[⬆ Back to top](#-github-portfolio-analyzer)**

</div>
