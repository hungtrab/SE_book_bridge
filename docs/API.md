# REST API

Conventions:

* All bodies / responses are JSON.
* Authenticated routes require the iron-session cookie (set on login).
* Successful mutations return `200` for updates, `201` for creates.
* Validation failures return `400` with `{ error, details }`.
* Authorization failures: `401` (not logged in) or `403` (logged in but
  not allowed).
* Conflicts (e.g. trying to edit a listing with an active transaction)
  return `409`.

> 🔑 Each endpoint is annotated with the **owner** in the `[#N]` tag. PRs
> that touch an endpoint should be reviewed by that owner.

## Auth & Profile [#1]

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | create account |
| POST | `/api/auth/login` | authenticate, sets cookie |
| POST | `/api/auth/logout` | destroy session |
| POST | `/api/auth/verify-email` | confirm token from email |
| POST | `/api/auth/reset-password` | start / complete reset |
| GET | `/api/users/me` | current user (auth required) |
| PATCH | `/api/users/me` | update profile |
| GET | `/api/users/[id]` | public profile |

## Book Catalog [#2]

| Method | Path | Description |
|---|---|---|
| GET | `/api/listings` | list with filters (q, genre, condition, type, maxPrice, communityId, cursor) |
| POST | `/api/listings` | create listing (auth) |
| GET | `/api/listings/[id]` | listing detail |
| PATCH | `/api/listings/[id]` | edit (owner only, blocked when accepted txn exists) |
| DELETE | `/api/listings/[id]` | soft-delete |
| POST | `/api/listings/photos` | upload 1+ photos, resize to WebP max 1024px, store local or S3, returns photo URLs |
| GET | `/api/isbn/lookup?isbn=...` | proxy Open Library |

## Discovery [#3]

| Method | Path | Description |
|---|---|---|
| GET | `/api/search` | full-text search across listings |
| GET | `/api/feed` | personalised feed (auth) |
| POST | `/api/follow` | `{ userId }` — follow a user |
| DELETE | `/api/follow/[userId]` | unfollow |

## Transactions & Messaging [#4]

| Method | Path | Description |
|---|---|---|
| POST | `/api/transactions` | request a book |
| GET | `/api/transactions` | my transactions |
| GET | `/api/transactions/[id]` | detail |
| POST | `/api/transactions/[id]/accept` | owner accepts |
| POST | `/api/transactions/[id]/decline` | owner declines |
| POST | `/api/transactions/[id]/cancel` | either party cancels (PENDING/ACCEPTED only) |
| POST | `/api/transactions/[id]/ship` | owner marks shipped |
| POST | `/api/transactions/[id]/complete` | requester confirms receipt |
| POST | `/api/transactions/[id]/dispute` | open a dispute |
| POST | `/api/transactions/[id]/rate` | submit a rating (after COMPLETED) |
| GET | `/api/conversations` | list conversations |
| GET | `/api/conversations/[id]/messages` | message history |
| POST | `/api/conversations/[id]/messages` | send a message |
| GET | `/api/conversations/[id]/stream` | SSE for live updates |
| POST | `/api/cron/transactions` | run 14-day reminder and 21-day auto-complete scheduler |

## Trust & Safety [#5]

| Method | Path | Description |
|---|---|---|
| GET | `/api/reputation/[userId]` | score breakdown |
| POST | `/api/reports` | file a report (target = user/listing/txn/message) |
| GET | `/api/reports/mine` | my reports |
| GET | `/api/moderation/queue` | mod-only |
| POST | `/api/moderation/[reportId]/act` | apply action (warn/remove/suspend) |
| POST | `/api/cron/reputation` | run time decay and anti-gaming scan |

## Community / Notifications / Admin [#6]

| Method | Path | Description |
|---|---|---|
| GET | `/api/communities` | list / search |
| POST | `/api/communities` | create (max-20 per user enforced) |
| GET | `/api/communities/[id]` | detail |
| POST | `/api/communities/[id]/join` | join |
| POST | `/api/communities/[id]/leave` | leave |
| GET | `/api/notifications` | mine, paginated |
| GET | `/api/notifications/stream` | SSE |
| POST | `/api/notifications/[id]/read` | mark read |
| POST | `/api/cron/notification-digest` | send unread daily notification digest |
| POST | `/api/cron/notification-immediate` | deliver pending immediate notification emails |
| GET/PATCH | `/api/notifications/preferences` | get/update email delivery preference |
| GET | `/api/admin/stats` | admin-only platform stats |
| GET | `/api/admin/grant-report.csv` | grant-sponsor CSV export |

## Standard error envelope

```json
{ "error": "Validation failed", "details": { "askingPriceVnd": [{ "code": "too_big" }] } }
```

The `details` field is the output of `zod.error.format()` so the client
can map field-level errors to its form state.
