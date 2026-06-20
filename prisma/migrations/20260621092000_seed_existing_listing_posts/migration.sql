WITH "available_community_listings" AS (
  SELECT listing.*
  FROM "Listing" listing
  WHERE listing."status" = 'ACTIVE'
    AND listing."communityId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "CommunityPost" existing
      WHERE existing."listingId" = listing."id"
    )
  ORDER BY listing."createdAt" DESC
  LIMIT 8
)
INSERT INTO "CommunityPost" (
  "id",
  "communityId",
  "authorId",
  "listingId",
  "title",
  "body",
  "isPinned",
  "createdAt",
  "updatedAt"
)
SELECT
  'cmock_listing_' || listing."id",
  listing."communityId",
  listing."ownerId",
  listing."id",
  CASE listing."transactionType"
    WHEN 'SELL' THEN 'For sale: ' || listing."title"
    WHEN 'GIFT' THEN 'Giving away: ' || listing."title"
    ELSE 'Open to exchange: ' || listing."title"
  END,
  CASE listing."transactionType"
    WHEN 'SELL' THEN
      'I am offering this copy of ' || listing."title" || ' by ' || listing."author" ||
      ' to another reader. ' || listing."description"
    WHEN 'GIFT' THEN
      'I have finished reading ' || listing."title" || ' by ' || listing."author" ||
      ' and would like it to find a new reader. ' || listing."description"
    ELSE
      'I would like to exchange ' || listing."title" || ' by ' || listing."author" ||
      ' with another member. ' || listing."description"
  END,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "available_community_listings" listing;
