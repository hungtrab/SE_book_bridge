-- Denormalised social counters for profile and listing-card reads.
ALTER TABLE "User"
ADD COLUMN "followerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "followingCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "User" u
SET "followerCount" = (SELECT COUNT(*)::INTEGER FROM "Follow" f WHERE f."followeeId" = u.id),
    "followingCount" = (SELECT COUNT(*)::INTEGER FROM "Follow" f WHERE f."followerId" = u.id);

-- Remove any historical duplicate materialised feed rows before enforcing
-- idempotent fan-out. Rows with NULL listingId remain unrestricted.
DELETE FROM "FeedItem"
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY "userId", "listingId", kind
      ORDER BY "createdAt" ASC, id ASC
    ) AS row_number
    FROM "FeedItem"
    WHERE "listingId" IS NOT NULL
  ) duplicates
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "FeedItem_userId_listingId_kind_key"
ON "FeedItem"("userId", "listingId", kind);

CREATE INDEX "User_locationDistrict_idx" ON "User"("locationDistrict");
CREATE INDEX "Listing_status_genre_transactionType_idx" ON "Listing"("status", "genre", "transactionType");
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");

-- PostgreSQL full-text search: title receives the strongest relevance weight,
-- then author/ISBN, then description. Prisma intentionally does not map this
-- generated implementation column.
ALTER TABLE "Listing"
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("author", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("isbn", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'C')
) STORED;

CREATE INDEX "Listing_search_vector_idx" ON "Listing" USING GIN (search_vector);
