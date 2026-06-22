# BookBridge

## A trust-driven book sharing platform for campus communities

---

## The Problem

Books are expensive. Students buy them once, read them once, and shelve them forever.
Facebook Marketplace has no trust layer. Library waitlists are long.
There is no purpose-built space where readers can gift, exchange, or sell books at symbolic prices inside a community they already belong to.

---

## The Solution

BookBridge is a web platform where students and local readers can list second-hand books, request them from each other, coordinate delivery, and build a verified reputation through completed exchanges.

Three exchange modes in one place:

| Mode | What it means |
|---|---|
| Gift | Owner gives the book away for free |
| Exchange | Owner trades for another book |
| Sell | Owner sets a price capped at 50,000 VND |

The 50,000 VND cap is a hard business rule enforced server-side. It keeps the platform non-commercial and aligned with its grant-funded mission.

---

## Key Figure 1: Six Modules, One Platform

Every capability maps to one of six modules, each owned by one team member.

```
Identity & Profile       Book Catalog
      │                       │
      └──────────┬────────────┘
                 │
          Discovery & Feed
                 │
      ┌──────────┴────────────┐
      │                       │
Transactions           Trust & Safety
& Messaging
      │                       │
      └──────────┬────────────┘
                 │
        Community & Ops
```

| Module | Owner | Core responsibility |
|---|---|---|
| Identity & Profile | Person 1 | Auth, sessions, user profiles |
| Book Catalog | Person 2 | Listings CRUD, photos, ISBN lookup |
| Discovery & Feed | Person 3 | Full-text search, personalised feed, follow graph |
| Transactions & Messaging | Person 4 | State machine, in-app chat, ratings |
| Trust & Safety | Person 5 | Reputation engine, reports, moderation queue |
| Community & Ops | Person 6 | Sub-communities, notifications, admin dashboard, CI/CD |

---

## Key Figure 2: The Transaction State Machine

The transaction lifecycle is the core value of BookBridge. Eight states, twelve transitions, fully audited.

```
                ┌──────────┐
                │  PENDING │ ◄── user requests listing
                └────┬─────┘
         ┌───────────┼───────────┐
       accept      decline    cancel
         │           │           │
         ▼           ▼           ▼
    ┌──────────┐ ┌─────────┐ ┌───────────┐
    │ ACCEPTED │ │DECLINED │ │ CANCELLED │
    └────┬─────┘ └─────────┘ └───────────┘
         │
       ship
         │
         ▼
   ┌─────────────┐
   │ IN_DELIVERY │ ──── 14 days ──► reminder notification
   └──────┬──────┘ ──── 21 days ──► auto-complete (cron)
          │
   ┌──────┴──────┐
 complete      dispute
   │               │
   ▼               ▼
┌───────────┐  ┌──────────┐
│ COMPLETED │  │ DISPUTED │ ──► moderator reviews
└─────┬─────┘  └──────────┘
    rate              │
      │         ┌─────┴──────┐
      ▼       resolve      reject
  (rated)       │              │
                ▼              ▼
           COMPLETED      CANCELLED
```

Rules:
- Multiple requesters are queued chronologically. Owner accepts one; the rest move to WAITLISTED.
- If an accepted transaction is cancelled, the top of the waitlist is promoted automatically.
- Every transition writes one row to TransactionEvent. Nothing is ever deleted. Full audit trail.
- The pure state machine logic lives in `src/server/transactions/state-machine.ts` with 13 passing unit tests, zero database dependencies.

---

## Key Figure 3: Four Reputation Tiers

Reputation is earned through completed transactions, positive ratings, and community contribution. It decays slowly with inactivity.

```
  0 ──────── 19      New Member        Grey badge
 20 ──────── 49      Active Sharer     Blue badge
 50 ──────── 79      Trusted Contributor  Green badge
 80 ──────── 100     Community Champion   Gold badge
```

Score changes per event:

| Event | Delta |
|---|---|
| Transaction completed | +10 both parties |
| Rating received 5 stars | +5 |
| Rating received 1 star | -3 |
| Report upheld against user | -15 |
| Cancellation (cancelling party) | -3 |
| 30 days inactive | -1 (cron job) |

Anti-gaming logic flags two patterns automatically:

1. Reciprocal-only pairs: two users who only trade with each other and no one else.
2. Zero-unique-counterparty accounts: accounts whose entire history is one trading partner.

Flagged users enter the moderation queue. They are never auto-suspended. A human moderator reviews every flag.

Score is denormalised into `User.reputationScore` for fast reads on listing cards and profile pages. The `ReputationEvent` table is the source of truth.

---

## Key Figure 4: The 50,000 VND Price Cap

The cap is not advisory. It is enforced at three layers:

```
Browser form
    │  client disables submit if price > cap (UX)
    ▼
API route  POST /api/listings
    │  Zod schema rejects price > SALE_PRICE_CAP_VND env var
    ▼
Service layer  listings/service.ts
    │  second check before Prisma write
    ▼
Database
    │  askingPriceVnd stored only for SELL type
    ▼
Grant reporting
    │  admin CSV shows all transactions with price breakdown
```

Why it matters for the business case:
- Keeps the platform eligible for educational grants (non-commercial mission).
- Removes the legal risk of operating as a marketplace.
- Configurable via environment variable. The default is 50,000 VND. A sponsor can adjust it without a code change.

---

## Key Figure 5: Real-time Without a Separate Service

BookBridge delivers live notifications and live chat without WebSockets or a message broker.

```
Client browser
    │
    │  SSE connection  (HTTP persistent)
    ▼
/api/notifications/stream          /api/conversations/[id]/stream
    │                                        │
    │  reads from Notification table         │  reads from Message table
    │  pushes new rows as they arrive        │  pushes new messages as they arrive
    ▼                                        ▼
Server-Sent Events (one-way push)   Server-Sent Events (one-way push)

Outbound (user sending a message or triggering an action):
    │
    │  regular POST request
    ▼
API route writes to database
    │
    │  SSE stream on the other client picks it up
    ▼
Real-time update appears
```

Fallback: if SSE is blocked by a proxy or browser policy, the client falls back to long-polling via `GET /api/notifications?wait=1&after=<cursor>`.

On Vercel free tier, SSE functions timeout at 60 seconds. The client reconnects automatically. On Pro tier, `maxDuration = 300` removes this limit.

---

## Key Figure 6: Infrastructure on Standard Cloud

```
GitHub repository
    │
    │  push to main branch
    ▼
GitHub Actions CI
    │  npm ci
    │  prisma migrate deploy
    │  tsc --noEmit (type check)
    │  vitest run (unit tests)
    │  next build
    ▼
Vercel (Next.js app)
    │
    ├── pages and API routes (Node 20, serverless functions)
    ├── SSE streams (persistent functions, maxDuration)
    └── Cron jobs (vercel.json schedule)
            │  /api/cron/transactions   daily  (14d reminder, 21d auto-complete)
            │  /api/cron/reputation     daily  (time decay, anti-gaming scan)
            │  /api/cron/notification-digest   daily  (email digest)
            │  /api/cron/notification-immediate  every 5 min  (immediate emails)
    │
    ▼
Managed PostgreSQL (Supabase / Neon / Vercel Postgres)
    │  13 entities, 30+ indexes
    │  Prisma 5 ORM
    ▼
S3-compatible bucket (Cloudflare R2 or AWS S3)
    │  book photos normalised to WebP, max 1024px
    │  served via CDN
```

Performance targets from the SRS:
- Initial page load: under 3 seconds on 4G
- Search response: under 2 seconds at 95th percentile
- Concurrent users: 1,000 or more
- Monthly uptime: 99.5 percent

All targets are achievable on a single Postgres instance with the indexes already defined in `prisma/schema.prisma`.

---

## Module Deep Dive: Identity and Profile

Owned by Person 1. Every other module depends on this one.

```
Register
    │  email + password (8+ chars, upper + lower + digit)
    │  Argon2id hash stored, never plaintext
    ▼
Email verification token (TTL 72 hours)
    │  user clicks link in email
    ▼
Account ACTIVE
    │
    ├── Login  →  iron-session cookie (signed + AES-encrypted)
    │              httpOnly, sameSite=lax
    │              30-minute sliding session
    │
    ├── Password reset  →  token TTL 1 hour
    │
    └── Profile edit  →  displayName, avatar, bio, genres, district
```

Public interface used by all five other modules:

```typescript
getCurrentUser(): Promise<User | null>
requireUser(): Promise<User>
requireRole(...roles: UserRole[]): Promise<User>
```

Security choices:
- Argon2id over bcrypt: memory-hard, resistant to GPU attacks, PHC 2015 winner.
- Constant-time login check: `argon2.verify` runs against a dummy hash even when the email does not exist. Prevents timing-based user enumeration.
- Rate limiting: 5 failed attempts per 15 minutes per IP before lockout.

---

## Module Deep Dive: Book Catalog

Owned by Person 2. The inventory layer of the platform.

```
Create listing
    │  title, author, ISBN, genre, condition, description
    │  1 to 5 photos (max 5 MB each, normalised to WebP 1024px)
    │  type: GIFT / EXCHANGE / SELL
    │  price: required if SELL, capped at 50,000 VND
    ▼
ACTIVE listing
    │
    ├── ISBN auto-fill  →  Open Library API  →  populate title, author, publisher
    │                      fallback: manual entry (no ISBN required)
    │
    ├── Edit  →  blocked when transaction is ACCEPTED or IN_DELIVERY
    │            allowed when PENDING (notification sent to waiting requesters)
    │
    ├── Mark Unavailable  →  status = UNAVAILABLE, pending requests cancelled
    │
    └── Delete  →  status = REMOVED (soft delete, audit preserved)

Listing status flow:
ACTIVE  →  RESERVED (transaction accepted)  →  COMPLETED (transaction done)
        →  UNAVAILABLE (hidden by owner)
        →  REMOVED (deleted or moderated)
```

---

## Module Deep Dive: Discovery and Feed

Owned by Person 3. How readers find books and follow each other.

```
Search query  GET /api/search?q=sapiens&genre=non-fiction&condition=GOOD
    │
    │  Zod parses and validates all filter params
    ▼
PostgreSQL full-text search
    │  tsvector on title, author, description
    │  GIN index for fast lookup
    │  ts_rank: title weight A > author weight B > description weight C
    │  Combinable filters: genre AND condition AND transactionType AND maxPrice
    ▼
Paginated results (cursor-based, not offset)

Social graph:
User A  ──follows──►  User B
                          │
                   publishes listing
                          │
              fan-out writes FeedItem for User A
                          │
              User A opens feed  →  sees new listing

Feed query: FeedItem WHERE userId = A ORDER BY createdAt DESC (GIN index on userId + createdAt)
```

Benchmark: `npm run db:seed:search-benchmark` seeds 1,000 listings. With GIN index, search latency drops from ~200ms to ~5ms.

---

## Module Deep Dive: Transactions and Messaging

Owned by Person 4. The most complex module in the system.

```
Transaction request flow:
User B sees listing  →  POST /api/transactions  →  PENDING
Owner A receives notification
Owner A opens /transactions  →  sees PENDING tab
Owner A accepts  →  ACCEPTED  →  listing status = RESERVED
All other requesters  →  WAITLISTED

Delivery coordination:
ACCEPTED  →  owner marks shipped  →  IN_DELIVERY  →  tracking number stored
                                         │
                                    14 days  →  reminder notification (cron)
                                    21 days  →  auto-complete (cron, optimistic lock)

Completion:
Requester confirms receipt  →  COMPLETED  →  both parties prompted to rate
Rating 1-5 stars + optional comment  →  ReputationEvent emitted  →  scores updated

Dispute:
Either party raises dispute  →  DISPUTED
Moderator reviews on /moderation queue
Moderator resolves  →  COMPLETED  or  CANCELLED

In-app chat:
Transaction accepted  →  Conversation created (tied to transaction ID)
Either party sends message  →  POST /api/conversations/[id]/messages
Other party receives via SSE stream  →  real-time update
```

The state machine is a pure function in `state-machine.ts`. It takes current state + action and returns next state or throws. No database access. Fully unit tested with 13 test cases covering every valid and invalid transition.

---

## Module Deep Dive: Trust and Safety

Owned by Person 5. What makes BookBridge different from Facebook Marketplace.

```
Reputation pipeline:
Transaction event emitted by Person 4
    │
    ▼
ReputationEvent written to database (atomic with transaction update)
    │
    ▼
User.reputationScore updated (denormalised cache)
    │
    ▼
Tier recalculated  →  notification if tier changed

Moderation pipeline:
User files report (user / listing / transaction / message)
    │
    ▼
Report row PENDING in database
    │
    ▼
Moderator opens /moderation queue
    │  community moderators see only reports in their community scope
    │  admin sees everything
    ▼
Moderator takes action:
    WARN user  →  notification sent
    REMOVE_LISTING  →  listing.status = REMOVED
    SUSPEND_USER  →  user.status = SUSPENDED, login blocked
    RESTORE  →  reverses suspension
    RESOLVE_DISPUTE  →  transaction → COMPLETED
    REJECT_DISPUTE  →  transaction → CANCELLED

Every action writes a ModerationAction row. Full audit trail for compliance and appeals.

Anti-gaming (weekly cron):
Scan ReputationEvent table  →  find reciprocal-only pairs and zero-unique-counterparty accounts
    →  flag users  →  add to moderation queue  →  human reviews
    (never auto-suspend)
```

---

## Module Deep Dive: Community and Ops

Owned by Person 6. The connective tissue of the platform.

```
Community structure:
Community (scope: UNIVERSITY / LOCATION / GENRE)
    │
    ├── Members (max 20 communities per user, enforced server-side)
    ├── Listings scoped to community (visible only to members + globally searchable)
    └── Announcements (notification to all members)

Notification dispatcher (central event router):
txn.status_changed  ──►  notify owner + requester
rating.created      ──►  notify rated user
listing.created     ──►  fan-out to followers + community members
report.upheld       ──►  notify reported user
tier.changed        ──►  notify user
new.message         ──►  notify recipient

Email preferences per user:
    IMMEDIATE  →  email sent within 5 minutes (cron every 5 min)
    DAILY      →  digest email at 8am (cron daily)
    OFF        →  no email, in-app only

Admin dashboard:
    Active users, completed transactions, books circulated, active listings
    Communities count, pending moderation reports
    Grant report CSV export with date range filter (OWASP CSV injection safe)

CI/CD pipeline:
    Every push to main:
        npm ci  →  prisma generate  →  prisma migrate deploy
        tsc --noEmit  →  vitest run  →  next build
    Hosted PostgreSQL test database in GitHub Actions
    Auto-deploy to Vercel on green CI
```

---

## Data Model at a Glance

13 entities across 6 modules.

```
User ──────────────────────────────────────────────────────────────┐
  │                                                                 │
  ├── Session                                                       │
  ├── Listing ────► ListingPhoto                                    │
  │        └──────► Transaction ────► TransactionEvent             │
  │                       └─────────► Rating                       │
  │                       └─────────► Conversation ──► Message     │
  ├── Follow (self-join)                                            │
  ├── FeedItem                                                      │
  ├── ReputationEvent                                               │
  ├── Report ──────────────────────────► ModerationAction          │
  ├── CommunityMembership ──► Community                            │
  └── Notification                                                  │
                                                                    │
All relations back to User ◄───────────────────────────────────────┘
```

Key design decisions:
- `User.reputationScore` is a denormalised cache. `ReputationEvent` is the source of truth.
- `TransactionEvent` is append-only. Every state transition is preserved permanently.
- `FeedItem.payload` is JSON. Feed can carry new listing events, community announcements, or future event types without a schema migration.
- `Notification.payload` is JSON for the same reason.
- All owner-scoped data uses `onDelete: Cascade`. Cross-module soft links use `onDelete: SetNull`.

---

## Technology Choices

| Choice | Why |
|---|---|
| Next.js 14 App Router | One language (TypeScript) front to back. Server components reduce client JavaScript. Route handlers are standard HTTP, no framework lock-in. |
| PostgreSQL 16 | Full-text search, GIN indexes, transactional integrity, and JSONB in one system. No need for a separate search service at this scale. |
| Prisma 5 | Type-safe queries, migration tooling, schema as documentation. |
| iron-session | Signed and AES-encrypted cookies. Simpler than JWT for a single-app session model. No refresh token complexity. |
| Argon2id | PHC 2015 winner. Memory-hard. Resists GPU and side-channel attacks. |
| Server-Sent Events | One-way push is sufficient for notifications and chat delivery. No WebSocket server needed. Native HTTP reconnect. |
| Zod | Runtime validation colocated with the service that owns the schema. API routes call `safeParse` before any business logic runs. |
| Vitest | Fast, TypeScript-native, Jest-compatible. State machine and reputation logic tested with zero database overhead. |

---

## Non-Functional Targets

| Metric | Target |
|---|---|
| Initial page load (4G) | Under 3 seconds |
| Search response (p95) | Under 2 seconds |
| Concurrent users | 1,000 or more |
| Monthly uptime | 99.5 percent |
| Test coverage | 70 percent or more |
| Accessibility | WCAG 2.1 Level AA |
| Internationalisation | Vietnamese and English |
| Location precision | District level only, no exact coordinates |
| Password hashing | Argon2id (bcrypt also OWASP-acceptable as fallback) |
| Session security | Signed cookies, rate-limited login, 30-minute sliding timeout |

---

## Alignment with Stated Mission

> A trust-driven online community where book lovers gift, exchange, or sell pre-owned books at symbolic prices, keeping books in circulation and out of landfills.

| Mission element | How the platform enforces it |
|---|---|
| Trust-driven | Reputation tiers, anti-gaming detection, moderation queue, full audit trail |
| Book lovers | Community scoping by university, location, and genre |
| Symbolic prices | 50,000 VND cap enforced at API and service layer |
| Keeping books in circulation | Completed transaction count on admin dashboard, grant CSV export |
| Non-commercial | No payment processing, no card data stored, money exchanged out of band |

Aligned with UN SDG 4 (Quality Education) and SDG 12 (Responsible Consumption).
