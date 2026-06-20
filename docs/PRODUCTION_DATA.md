# Production data, migrations, seeds, and daily book bulletins

BookBridge uses one hosted PostgreSQL database. Vercel runs the application,
but schema migrations and deterministic demo data are separate operations.

Vercel uses the `vercel-build` package script, which runs
`prisma migrate deploy` before compiling the application. This prevents a
deployment from serving code that expects columns or tables that have not
been created yet. The manual production workflow remains available for
controlled migration and seed operations.

## What the seed creates

`npm run db:seed` now creates a coherent demonstration network:

- 12 verified demo accounts, including moderator and administrator roles;
- 8 communities with memberships and moderators;
- 24 listings across gift, exchange, and symbolic-sale types;
- follows, personalized feed items, notifications, reports, and reputation;
- transactions in pending, accepted, waitlisted, in-delivery, completed, and
  disputed states;
- conversations, messages, ratings, community posts, threaded replies, and
  reactions.

Every demo account uses `Password1`. Do not present these accounts as real
people, and do not enable demo credentials on a public production service
unless the team intentionally wants a public sandbox.

## Safe first deployment

1. Create a database backup or provider snapshot.
2. Confirm Vercel and GitHub use the same production `DATABASE_URL`.
3. First push a migration-only commit containing the Prisma schema, migration,
   and `production-data.yml`. The migration is additive, so the old application
   remains compatible while it is applied.
4. In GitHub, create an Environment named `production`.
5. Add `DATABASE_URL` as an Environment secret. Add `NYT_BOOKS_API_KEY`
   only if the optional New York Times source is enabled.
6. Add required reviewers to the `production` Environment.
7. Open Actions → `production-data` → Run workflow.
8. Choose `migrate` and wait for it to complete.
9. Push the application/UI commit. Vercel can now deploy code that uses the
   new columns and tables without racing the migration.
10. After the Vercel deployment is healthy, run `migrate-and-seed` only if
   this production database is intentionally a demonstration database.
11. Run `import-bulletins` once to populate the first daily bulletin batch.

The workflow serializes production database operations so two migrations or
seeds cannot run concurrently.

## Command-line equivalent

Use a direct, non-pooled PostgreSQL URL for migrations if the provider supplies
both pooled and direct URLs.

```powershell
$env:DATABASE_URL="postgresql://..."
npm ci
npm run db:generate
npm run db:deploy
```

For an intentional production demo seed:

```powershell
$env:NODE_ENV="production"
$env:SEED_ALLOW_PRODUCTION="YES_I_UNDERSTAND"
npm run db:seed
```

The production guard prevents accidental seeding without the explicit phrase.
The seed removes and recreates only known deterministic demo content. Imported
bulletins are preserved.

## Daily bulletin ingestion

Vercel calls `/api/cron/book-bulletins` daily at 00:15 UTC. The route requires
the same `CRON_SECRET` used by the other cron routes.

Sources:

- [Open Library APIs](https://openlibrary.org/developers/api), using daily
  trending works and Open Library cover images;
- official Library of Congress
  [Bookmarked](https://blogs.loc.gov/bookmarked/feed/) and
  [Bibliomania](https://blogs.loc.gov/bibliomania/feed/) RSS feeds;
- [Project Gutenberg](https://www.gutenberg.org/), using its daily ebook RSS
  feed;
- [Internet Archive](https://archive.org/), using the public advanced search
  API for recently archived texts;
- optional [New York Times Books API](https://developer.nytimes.com/docs/books-product/1/overview);
- [Guardian Books](https://www.theguardian.com/books), using its daily books RSS feed;
- [NPR Book of the Day](https://www.npr.org/podcasts/510364/book-of-the-day),
  using the official podcast feed;
- [AP Books & Literature](https://apnews.com/hub/books-and-literature), using
  the current article links published on the AP books hub.

Google Books remains available for future metadata enrichment through its
[official API](https://developers.google.com/books/docs/v1/using), but it is
not required by the daily importer.

Only titles, short summaries, source attribution, images supplied by the
source, publication dates, and outbound links are stored. Full articles are
not copied. Each source ID has a database uniqueness constraint, making the
import idempotent.

Imported content appears in the global `/bulletins` feed and in the
BookBridge bulletin community timeline. Named subcommunities still show their
own member-created posts.

Required Vercel variables:

```text
DATABASE_URL
CRON_SECRET
BULLETIN_COMMUNITY_NAME=Book News & Discoveries
BULLETIN_AUTHOR_EMAIL=admin@bookbridge.local
NYT_BOOKS_API_KEY=        # optional
```

## Community image storage

Set `UPLOAD_BACKEND=s3` in Vercel. Local filesystem uploads are not durable in
serverless deployments. Cloudflare R2, AWS S3, or another S3-compatible store
can be configured with the existing `S3_*` variables.

Post and listing images are validated, auto-rotated, resized to fit within
1024×1024, converted to WebP, and cached with immutable object URLs.

## Verification checklist

After migration and seed:

```powershell
npx prisma migrate status
npm run bulletins:import
```

Then verify:

- `/listings` displays friendly labels without enum underscores;
- `/transactions` displays `In delivery`;
- `Book News & Discoveries` contains attributed bulletins;
- community post image upload persists after a Vercel redeploy;
- post and comment reactions survive refresh;
- replies appear one level beneath their parent comments;
- rerunning the seed does not duplicate deterministic rows.

Never use `prisma db push` on production. Never run `prisma migrate dev`
against production.
