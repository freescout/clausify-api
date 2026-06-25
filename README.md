# Clausify API

Backend REST API for **Clausify** — a tool that analyzes Terms & Conditions / Privacy Policy pages and returns a plain-language risk score, so users understand what they're agreeing to before they click "Accept."

This is the backend that powers the Clausify Chrome extension and web platform.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify
- **Database:** PostgreSQL (via Docker)
- **ORM:** Prisma 7 (with the `pg` driver adapter)
- **Auth:** JWT + bcrypt
- **AI:** Anthropic Claude API (`claude-haiku-4-5`) — clause extraction & scoring
- **Package manager:** Yarn (node-modules linker)

---

## Related repos

- [`freescout/clausify`](https://github.com/freescout/clausify) — React 19 frontend
- [`freescout/clausify-extension`](https://github.com/freescout/clausify-extension) — Chrome extension (MV3)

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Yarn
- An Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

---

## Local Setup

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values (see [Environment variables](#environment-variables)).

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Generate the Prisma client & run migrations

```bash
yarn db:generate
yarn db:migrate
```

### 5. Start the dev server

```bash
yarn dev
```

The API runs at **http://localhost:3000**.  
Health check: **http://localhost:3000/health**

---

## Environment variables

| Variable            | Description                     | Default                   |
| ------------------- | ------------------------------- | ------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string    | —                         |
| `JWT_SECRET`        | Secret used to sign JWTs        | `change-me-in-production` |
| `ANTHROPIC_API_KEY` | Anthropic API key               | —                         |
| `PORT`              | Port to listen on               | `3000`                    |
| `HOST`              | Host to bind to                 | `0.0.0.0`                 |
| `CORS_ORIGINS`      | Comma-separated allowed origins | `http://localhost:5173`   |
| `NODE_ENV`          | `development` or `production`   | —                         |

---

## Scripts

| Command            | Description                                         |
| ------------------ | --------------------------------------------------- |
| `yarn dev`         | Start dev server with hot reload                    |
| `yarn build`       | Compile TypeScript to `dist/`                       |
| `yarn start`       | Run the compiled output                             |
| `yarn db:generate` | Regenerate the Prisma client                        |
| `yarn db:migrate`  | Create & apply a migration                          |
| `yarn db:push`     | Push schema to DB without a migration (prototyping) |
| `yarn db:studio`   | Open Prisma Studio (database GUI)                   |

---

## Data Model

The core hierarchy:

```
Site → CgvVersion → Analysis → Clause
```

- **Site** — a website that has been analyzed (global — one record per domain, shared across users)
- **CgvVersion** — a captured snapshot of a site's T&C text; a new version is created when the text changes (detected via SHA-256 content hash). This powers the history feature.
- **Analysis** — the AI analysis of one version (score, rating, clauses). 1-to-1 with CgvVersion.
- **Clause** — an individual flagged clause (type, severity, score impact)

For the tagging feature:

- **User** — account (email + bcrypt password hash)
- **Tag** — a user's custom label (name + color). Per-user.
- **SiteTag** — links tags to sites (many-to-many junction)

Score caching: `current_global_score` and `current_rating` are denormalized onto `Site` for fast list reads.

---

## API Endpoints

All endpoints are prefixed with `/api`. Protected routes (🔒) require an `Authorization: Bearer <token>` header.

### Health

```
GET /health
```

### Auth

```
POST /api/auth/register     — { email, password, name } → { token, user }
POST /api/auth/login        — { email, password } → { token, user }
```

### Analysis

```
POST /api/analyze           🔒 — { text, domain, sourceUrl, language? } → AnalysisResult
```

Called by the Chrome extension after extracting T&C text from a page. Returns a cached result (200) if the same text hash has been analyzed before, or a fresh Claude analysis (201) otherwise.

`language` is optional: `"en"` (default) or `"fr"`.

**AnalysisResult:**

```json
{
  "domain": "example.com",
  "analyzed_at": "2026-06-10T12:40:12.156Z",
  "global_score": 30,
  "rating": "red",
  "clauses": [
    {
      "type": "personal_data",
      "content": "...",
      "severity": "high",
      "score_impact": -20
    }
  ]
}
```

### Sites

```
GET /api/sites                              🔒 — SiteListItem[]
GET /api/sites/:domain/history              🔒 — SiteDetail (with cgv_versions → analysis → clauses)
GET /api/sites/:domain/history/:historyId   🔒 — CgvVersion (single version with analysis)
```

### Tags

```
GET    /api/tags                        🔒 — Tag[] (current user's tags only)
POST   /api/tags                        🔒 — { name, color? } → Tag
PATCH  /api/tags/:tagId                 🔒 — { name?, color? } → Tag
DELETE /api/tags/:tagId                 🔒 — 204
POST   /api/tags/:tagId/sites/:siteId   🔒 — 204 (assign tag to site)
DELETE /api/tags/:tagId/sites/:siteId   🔒 — 204 (remove tag from site)
```

---

## Scoring Algorithm

Claude returns a `score_impact` (negative integer) per clause. The server recalculates the final score server-side as a safeguard against model drift:

```
global_score = max(0, 100 + sum(score_impacts))
```

Ratings:

- 🟢 `green` — score 66–100
- 🟡 `orange` — score 31–65
- 🔴 `red` — score 0–30

---

## Architecture

```
src/
├── app.ts              # Fastify setup, plugins, route registration
├── index.ts            # Entry point (listen)
├── controllers/
│   ├── analysis.ts
│   ├── auth.ts
│   ├── sites.ts
│   └── tag.ts
├── services/
│   ├── analysis.ts     # Claude API integration + score recalculation
│   └── auth.ts         # bcrypt + user creation
├── routes/
│   ├── analysis.ts
│   ├── auth.ts
│   ├── sites.ts
│   └── tag.ts
├── middleware/
│   └── auth.ts         # JWT verification (jwtVerify)
├── lib/
│   └── prisma.ts       # Prisma client singleton (pg adapter)
└── types/
    └── index.ts        # Shared TypeScript types
```

---

## Status

- [x] Project setup (TypeScript, Yarn, folder structure)
- [x] Database schema (Prisma) + migrations
- [x] Prisma client (v7 pg adapter)
- [x] Fastify server + core plugins + health check
- [x] Auth (register / login / JWT middleware)
- [x] Analysis service (Claude integration + server-side scoring)
- [x] `POST /api/analyze` with content-hash caching
- [x] `GET /api/sites` + history endpoints
- [x] Tags endpoints (CRUD + assign to sites)
- [x] End-to-end verified through real frontend UI
- [ ] Tests
- [ ] Docker setup for the API itself
- [ ] `.env.example`
