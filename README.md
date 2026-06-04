# BookBridge

> Software Engineering capstone — 2025.2 — Team Zootopia (6 members)

A community-based platform for second-hand book sharing — gift, exchange, or sell pre-owned books at symbolic prices, with a trust-driven reputation system. See [`docs/SRS_summary.md`](docs/SRS_summary.md) for the abridged Software Requirements Specification.

## Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | **Next.js 14** (App Router, TypeScript) |
| Database | **PostgreSQL 16** |
| ORM | **Prisma 5** |
| Auth | NextAuth credentials provider + session cookies |
| Validation | **Zod** |
| UI | Tailwind CSS + shadcn/ui primitives |
| Real-time | Server-Sent Events (notifications, messages) |
| Testing | **Vitest** (unit) + Playwright (e2e, optional) |
| CI/CD | GitHub Actions |

A single language (TypeScript) front-to-back keeps the project approachable for a 6-person team where most members have not built a web app before.

## Quick start

```bash
# 1. Install deps + start a local Postgres
npm install
docker compose up -d db          # PostgreSQL on :5432

# 2. Configure environment
cp .env.example .env             # adjust DATABASE_URL if needed

# 3. Initialise the schema and seed sample data
npm run db:migrate
npm run db:seed

# 4. Run the dev server
npm run dev                      # http://localhost:3000

# 5. Tests
npm test                         # unit tests
npm run lint                     # eslint + tsc
```

Demo accounts from `npm run db:seed` all use password `Password1`:

| Role | Email |
|---|---|
| User | `alice@bookbridge.local`, `bob@bookbridge.local`, `clara@bookbridge.local`, `duy@bookbridge.local` |
| Moderator | `mod@bookbridge.local` |
| Admin | `admin@bookbridge.local` |

## Project layout

```
project/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── docker-compose.yml                 # local Postgres
├── .env.example
├── prisma/
│   ├── schema.prisma                  # 13 entities — see docs/ERD.md
│   └── seed.ts                        # demo users / listings / transactions
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # home feed
│   │   ├── (auth)/                    # login / register / verify-email
│   │   ├── listings/                  # browse, create, edit, view
│   │   ├── transactions/              # my transactions + detail
│   │   ├── messages/                  # 1-1 chat
│   │   ├── communities/               # sub-community pages
│   │   ├── profile/                   # public + edit profile
│   │   ├── moderation/                # moderator-only queue
│   │   ├── admin/                     # admin dashboard
│   │   └── api/                       # REST routes (auth, listings, transactions, …)
│   ├── components/
│   │   ├── ui/                        # shared primitives
│   │   ├── auth/, listings/, transactions/, messaging/, layout/, …
│   ├── server/                        # business logic per module (one folder per owner)
│   │   ├── auth/             ← Person 1
│   │   ├── users/            ← Person 1
│   │   ├── listings/         ← Person 2
│   │   ├── search/           ← Person 3
│   │   ├── social/           ← Person 3
│   │   ├── transactions/     ← Person 4
│   │   ├── messaging/        ← Person 4
│   │   ├── reputation/       ← Person 5
│   │   ├── moderation/       ← Person 5
│   │   ├── communities/      ← Person 6
│   │   ├── notifications/    ← Person 6
│   │   ├── admin/            ← Person 6
│   │   └── lib/                       # prisma client, auth-context, errors, validation
│   └── lib/                           # client-side helpers (api-client, format)
├── tests/                             # Vitest unit + integration tests
├── docs/
│   ├── SRS_summary.md
│   ├── ARCHITECTURE.md
│   ├── ERD.md                         # entity-relationship diagram
│   ├── API.md                         # REST endpoints
│   ├── DEPLOYMENT.md
│   └── TASKS.md                       # ⭐ 6-person work split (read this first)
└── .github/workflows/ci.yml
```

## ⭐ Team — 6 members

This module split is the most important artefact in the repo — it determines
who reviews whose code, who answers what questions in the demo, and who
gets credit for what. Each person owns roughly the same number of API
routes, server modules and pages so every commit history will look
balanced. **Read [`docs/TASKS.md`](docs/TASKS.md) before opening any PR.**

| # | Member | Module ownership |
|---|---|---|
| 1 | TBD | **Identity & Profile** — auth, sessions, user profiles |
| 2 | TBD | **Book Catalog** — listings CRUD, photos, ISBN lookup |
| 3 | TBD | **Discovery** — full-text search, feed, follow / unfollow |
| 4 | TBD | **Transactions & Messaging** — state machine, ratings, in-app chat |
| 5 | TBD | **Trust & Safety** — reputation engine, reports, moderation queue |
| 6 | TBD | **Community & Ops** — sub-communities, notifications, admin dashboard, DevOps / CI |

## Where to read code

* **Just want to see the architecture?** → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* **Want the data model?** → [`prisma/schema.prisma`](prisma/schema.prisma) + [`docs/ERD.md`](docs/ERD.md)
* **Want the REST API contract?** → [`docs/API.md`](docs/API.md)
* **Want to start coding your module?** → [`docs/TASKS.md`](docs/TASKS.md) and the matching `src/server/<your-module>/` folder
