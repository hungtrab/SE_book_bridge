# Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser (React + Tailwind)                    │
└─────────┬─────────────────────────────────────┬──────────────────────┘
          │ HTTPS (App Router pages)            │ fetch (REST + SSE)
          ▼                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          Next.js 14 (App Router)                     │
│                                                                      │
│   src/app/(pages)               src/app/api/**                       │
│         │                              │                             │
│         ▼                              ▼                             │
│        ┌──────────────────────────────────────┐                      │
│        │  src/server/  — domain modules       │                      │
│        │   • auth     • listings              │                      │
│        │   • search   • social                │                      │
│        │   • transactions  • messaging        │                      │
│        │   • reputation    • moderation       │                      │
│        │   • communities   • notifications    │                      │
│        │   • admin                            │                      │
│        └──────────────────────────────────────┘                      │
│                       │                                              │
│                       ▼                                              │
│                   Prisma 5  (TypeScript ORM)                         │
└────────────────────────┬─────────────────────────────────────────────┘
                         │
                         ▼
                  PostgreSQL 16
```

## Layering rules

1. **Pages** (`src/app/(pages)/`) and **API routes** (`src/app/api/`) only
   parse / validate input and call into a server module.
2. **Server modules** (`src/server/<module>/service.ts`) contain all
   business logic. They are the only places that talk to Prisma directly.
3. **Cross-module collaboration** goes through shared interfaces in
   `src/server/lib/` (auth-context, errors, prisma, validation). Do **not**
   import another module's `service.ts` from outside its folder — emit a
   domain event instead (see below).

## Domain events

Transactions, ratings and moderation actions emit events that other
modules subscribe to. We use a simple in-process EventEmitter; if scale
ever requires it we can swap in a message queue without touching the
publishers.

```
txn.completed   ─►  reputation +10 each (Person 5)
                   listing -> COMPLETED  (Person 2)
                   notify owner+requester (Person 6)

txn.cancelled   ─►  reputation -3 cancelling party (Person 5)
                   listing -> ACTIVE     (Person 2)
                   notify other party    (Person 6)

rating.created  ─►  reputation +/- by stars (Person 5)
                   notify rated user      (Person 6)

report.upheld   ─►  reputation -15 target (Person 5)
                   notify target          (Person 6)
                   listing -> REMOVED if applicable (Person 2)
```

The event names + payload shapes live in `src/server/lib/events.ts`.

## Data layer

* PostgreSQL 16 — see `prisma/schema.prisma`. 13 entities, ~30 indexes.
* All FKs use `onDelete: Cascade` for owner-scoped data, `onDelete: SetNull`
  for cross-module soft links (e.g. `Conversation.transactionId`).
* Reputation score is denormalised into `User.reputationScore` for fast
  reads; the source of truth is the `ReputationEvent` table.

## Auth

* Cookie-based session via `iron-session` (signed + AES-encrypted).
* Argon2id password hashing.
* Password complexity enforced at the Zod schema level.
* Roles: `GUEST | USER | MODERATOR | ADMIN`. Guards live in
  `src/server/lib/auth-context.ts` (`requireUser`, `requireRole`).

## Real-time

* Notifications: Server-Sent Events (`/api/notifications/stream`). One
  connection per user-tab.
* Messaging: SSE on the conversation route (`/api/conversations/[id]/stream`).
  No WebSocket needed — these are read-only push channels.
* Falls back to long-polling if the browser blocks SSE.

## Validation

`zod` schemas live next to the service that owns them, e.g.
`src/server/listings/service.ts` exports `ListingCreateSchema`. API routes
import the schema and call `safeParse` before invoking the service. This
keeps the service safe to call from anywhere (including tests) with
already-validated input.

## Testing

* `vitest` for unit + integration tests.
* DB-free tests live next to the pure logic (state machine, scoring,
  anti-gaming).
* DB-backed tests use a separate hosted PostgreSQL test database configured
  through `DATABASE_URL`. Unit tests remain database-free.
* Coverage target ≥ 70 %; `npm test -- --coverage`.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md). Short version: any platform that
runs Node 20 + PostgreSQL 16 will do — we recommend Vercel for frontend
and a managed Postgres (Supabase / Neon / RDS) for the DB.
