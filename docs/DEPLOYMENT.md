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
| `EMAIL_FROM`, `SMTP_*` | for verification flow | Use SES / SendGrid / Mailgun |
| `UPLOAD_BACKEND` | yes (`local` or `s3`) | S3 needed in prod |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | when UPLOAD_BACKEND=s3 | |
| `SALE_PRICE_CAP_VND` | optional | default 50,000 |

## Self-hosting (alternative)

Any Linux VM with Docker can run the stack:

```bash
docker compose up -d            # postgres
docker build -t bookbridge .    # the Next.js image
docker run --env-file .env -p 3000:3000 bookbridge
```

A `Dockerfile` will be added by Person 6 in the hardening sprint.

## Scaling notes

* **Database**: index hot paths first (already covered in
  `prisma/schema.prisma`); a single Postgres instance comfortably handles
  the 1 000-concurrent-users target.
* **Notifications fan-out**: when `Follow` count grows large, swap the
  inline write of `FeedItem` rows for a Redis Streams + worker pattern.
* **Search**: `ILIKE` is fine up to ~50 k listings. Past that, switch to
  Postgres full-text search (`tsvector`) — schema migration but no
  application change because the queries already abstract behind
  `searchListings()`.
