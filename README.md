# Clausify API

Backend REST API for **Clausify** — a tool that analyzes Terms & Conditions / Privacy Policy pages and returns a plain-language risk score, so users understand what they're agreeing to before they click "Accept."

This is the backend that powers the Clausify Chrome extension and web platform.

> 🚧 **Work in progress** — see the [status checklist](#status) below.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Fastify
- **Database:** PostgreSQL (via Docker)
- **ORM:** Prisma 7 (with the `pg` driver adapter)
- **Auth:** JWT + bcrypt
- **AI:** Anthropic Claude API (clause extraction & scoring)
- **Testing:** Vitest
- **Package manager:** Yarn

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- A Yarn install (project uses the `node-modules` linker — see `.yarnrc.yml`)
- An Anthropic API key (separate from a Claude.ai subscription — get one at the Anthropic console)

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

Then edit `.env` and fill in your values (database URL, JWT secret, Anthropic API key).

### 3. Start PostgreSQL

```bash
docker compose up -d
```

Check it's running:

```bash
docker compose ps
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
| `yarn test`        | Run the test suite (Vitest)                         |

---

## Data Model

The core hierarchy:

```
Site → CgvVersion → Analysis → Clause
```

- **Site** — a website that has been analyzed (one per domain)
- **CgvVersion** — a captured snapshot of a site's T&C text; a new version is created when the text changes (detected via content hash). This is what powers history.
- **Analysis** — the AI analysis of one version (score, rating, clauses)
- **Clause** — an individual flagged clause (type, severity, score impact)

Plus, for the tagging feature:

- **User** — account (email + password)
- **Tag** — a user's custom tag
- **SiteTag** — links tags to sites (many-to-many)

---

## API Endpoints

> 📝 _To be documented as endpoints are implemented._

| Method | Path      | Description    |
| ------ | --------- | -------------- |
| GET    | `/health` | Health check   |
|        |           | _more coming…_ |

---

## Scoring Algorithm

> 📝 _To be documented once implemented._

---

## Architecture

> 📝 _Architecture diagram & explanation to be added._

---

## Status

- [x] Project setup (TypeScript, Yarn, folder structure)
- [x] Database schema (Prisma) + initial migration
- [x] Prisma client (v7 pg adapter)
- [x] Fastify server entry + core plugins + health check
- [x] Auth (register / login / JWT middleware)
- [ ] Analysis service (Claude integration)
- [ ] Analysis endpoints (analyze / sites / history)
- [ ] Tags endpoints (CRUD + assign to sites)
- [ ] Tests
- [ ] Docker setup for the API
- [ ] Full documentation (API, scoring, architecture)
