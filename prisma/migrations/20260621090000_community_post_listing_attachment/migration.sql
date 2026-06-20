ALTER TABLE "CommunityPost"
  ADD COLUMN "listingId" TEXT;

ALTER TABLE "CommunityPost"
  ADD CONSTRAINT "CommunityPost_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CommunityPost_listingId_idx" ON "CommunityPost"("listingId");
