CREATE TYPE "ListingEngagementKind" AS ENUM ('LIKE', 'WISHLIST');

CREATE TABLE "ListingEngagement" (
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "kind" "ListingEngagementKind" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingEngagement_pkey" PRIMARY KEY ("userId", "listingId", "kind")
);

CREATE TABLE "ArtifactComment" (
  "id" TEXT NOT NULL,
  "artifactSlug" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArtifactComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtifactCommentLike" (
  "userId" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArtifactCommentLike_pkey" PRIMARY KEY ("userId", "commentId")
);

CREATE INDEX "ListingEngagement_listingId_kind_idx" ON "ListingEngagement"("listingId", "kind");
CREATE INDEX "ListingEngagement_userId_kind_createdAt_idx" ON "ListingEngagement"("userId", "kind", "createdAt");
CREATE INDEX "ArtifactComment_artifactSlug_createdAt_idx" ON "ArtifactComment"("artifactSlug", "createdAt");
CREATE INDEX "ArtifactComment_artifactSlug_likeCount_createdAt_idx" ON "ArtifactComment"("artifactSlug", "likeCount", "createdAt");
CREATE INDEX "ArtifactComment_authorId_idx" ON "ArtifactComment"("authorId");
CREATE INDEX "ArtifactCommentLike_commentId_idx" ON "ArtifactCommentLike"("commentId");

ALTER TABLE "ListingEngagement"
  ADD CONSTRAINT "ListingEngagement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingEngagement"
  ADD CONSTRAINT "ListingEngagement_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtifactComment"
  ADD CONSTRAINT "ArtifactComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtifactCommentLike"
  ADD CONSTRAINT "ArtifactCommentLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtifactCommentLike"
  ADD CONSTRAINT "ArtifactCommentLike_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "ArtifactComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
DECLARE
  admin_id TEXT;
  seller_id TEXT;
  listing_id TEXT;
  demo_transaction_id TEXT;
BEGIN
  SELECT id INTO admin_id FROM "User" WHERE role = 'ADMIN'::"UserRole" ORDER BY "createdAt" LIMIT 1;
  SELECT id, "ownerId" INTO listing_id, seller_id
  FROM "Listing"
  WHERE status = 'ACTIVE'::"ListingStatus"
    AND (admin_id IS NULL OR "ownerId" <> admin_id)
  ORDER BY "createdAt" DESC
  LIMIT 1;

  IF admin_id IS NOT NULL AND listing_id IS NOT NULL THEN
    INSERT INTO "ListingEngagement" ("userId", "listingId", kind)
    VALUES (admin_id, listing_id, 'WISHLIST'::"ListingEngagementKind")
    ON CONFLICT DO NOTHING;

    demo_transaction_id := 'demo-admin-' || substr(md5(admin_id || listing_id), 1, 20);
    IF NOT EXISTS (
      SELECT 1 FROM "Transaction"
      WHERE "requesterId" = admin_id AND "listingId" = listing_id
    ) THEN
      INSERT INTO "Transaction" (
        id, "listingId", "requesterId", "ownerId", status, type,
        "agreedPriceVnd", "createdAt", "updatedAt"
      )
      SELECT demo_transaction_id, l.id, admin_id, l."ownerId",
        'PENDING'::"TransactionStatus", l."transactionType", l."askingPriceVnd",
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM "Listing" l WHERE l.id = listing_id;

      INSERT INTO "TransactionEvent" (
        id, "transactionId", "toStatus", "byUserId", reason, "createdAt"
      ) VALUES (
        'demo-event-' || substr(md5(demo_transaction_id), 1, 20),
        demo_transaction_id, 'PENDING'::"TransactionStatus", admin_id,
        'admin_demo_request', CURRENT_TIMESTAMP
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM "Report"
      WHERE "filerId" = admin_id AND reason = 'Admin demo ticket'
    ) THEN
      INSERT INTO "Report" (
        id, "filerId", "targetType", "targetUserId", "targetListingId",
        reason, details, status, "isSystemGenerated", "createdAt"
      ) VALUES (
        'demo-report-' || substr(md5(admin_id || listing_id), 1, 20),
        admin_id, 'LISTING'::"ReportTargetType", seller_id, listing_id,
        'Admin demo ticket',
        'Mock ticket visible from the administrator account for client demonstrations.',
        'PENDING'::"ReportStatus", false, CURRENT_TIMESTAMP
      );
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  demo_author_id TEXT;
  demo_comment_id TEXT;
BEGIN
  SELECT id INTO demo_author_id
  FROM "User"
  WHERE status = 'ACTIVE'::"AccountStatus"
  ORDER BY "reputationScore" DESC
  LIMIT 1;

  IF demo_author_id IS NOT NULL THEN
    demo_comment_id := 'demo-artifact-' || substr(md5(demo_author_id), 1, 20);
    INSERT INTO "ArtifactComment" (
      id, "artifactSlug", "authorId", body, "likeCount", "createdAt", "updatedAt"
    ) VALUES (
      demo_comment_id, 'the-alchemist', demo_author_id,
      'The choices make the Personal Legend feel earned rather than simply destined.',
      0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
