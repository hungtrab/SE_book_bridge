# Deployment

A small platform like BookBridge can run on a single PaaS account. We
recommend the simplest setup for the course demo:

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  Vercel (Next.js app)    │ ─────► │  Managed Postgres         │
│  - free tier OK          │        │  (Supabase / Neon / RDS) │
│  - GitHub auto-deploy    │        └──────────────────────────┘
└──────────────────────────┘
            │
            ▼
   S3-compatible bucket
   (book photos, avatars)
```

## Vercel deploy (5-minute version)

1. Push the repo to GitHub.
2. On vercel.com → "Add new project" → import the repo.
3. Set the env vars from `.env.example` in the Vercel dashboard.
4. Add a managed Postgres add-on (Vercel Postgres, Neon, or Supabase).
5. Run migrations once: `npx prisma migrate deploy` from a one-off
   Vercel CLI session, or via a deploy hook.

## Environment variables

| Var | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes | 32+ bytes, generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | yes for email links | e.g. `https://se-book-bridge.vercel.app` |
| `EMAIL_FROM`, `SMTP_*`, `EMAIL_DIGEST_ENABLED` | for verification + digest | Use SES / SendGrid / Mailgun |
| `UPLOAD_BACKEND` | yes (`local` or `s3`) | S3 needed in prod |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_PUBLIC_BASE_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | when UPLOAD_BACKEND=s3 | `S3_ENDPOINT`/`S3_PUBLIC_BASE_URL` are useful for Cloudflare R2 or MinIO |
| `SALE_PRICE_CAP_VND` | optional | default 50,000 |
| `CRON_SECRET` | production scheduler | bearer secret for both `/api/cron/*` endpoints |

Book photos are normalised to WebP at max 1024px before storage. Local dev
serves them from `.uploads`; production should use `UPLOAD_BACKEND=s3`.

## Self-hosting (alternative)

Any Linux VM with Docker can run the stack:

```bash
docker compose up -d            # postgres
docker build -t bookbridge .    # the Next.js image
docker run --env-file .env -p 3000:3000 bookbridge
```

The included multi-stage `Dockerfile` builds the Next.js standalone server.
Run `npx prisma migrate deploy` as a release step before starting a new image.

`vercel.json` schedules transaction maintenance, reputation decay/anti-gaming,
daily notification digests, and immediate-email retry on a daily Hobby-safe
schedule. Upgrade Vercel to Pro or move this job to Inngest/Trigger.dev if the
team needs five-minute email delivery.
Vercel SSE functions reconnect after the configured 60-second function duration;
the notification client falls back to `GET /api/notifications?wait=1&after=...`
long-polling if `EventSource` is blocked or interrupted.

## Scaling notes

* **Database**: index hot paths first (already covered in
  `prisma/schema.prisma`); a single Postgres instance comfortably handles
  the 1 000-concurrent-users target.
* **Notifications fan-out**: when `Follow` count grows large, swap the
  inline write of `FeedItem` rows for a Redis Streams + worker pattern.
* **Search**: listing discovery uses the `searchListings()` abstraction with
  parameterized PostgreSQL `ILIKE` filters and lightweight relevance scoring.
  Keep the abstraction if the team later moves to `tsvector`, trigram fuzzy
  search, or an external search service.
