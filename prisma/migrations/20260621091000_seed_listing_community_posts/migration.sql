WITH "listing_post_seeds" (
  "id",
  "email",
  "communityName",
  "listingTitle",
  "postTitle",
  "postBody"
) AS (
  VALUES
    (
      'cmock_ai_modern_20260621',
      'minh@bookbridge.local',
      'Software Textbooks',
      'Artificial Intelligence: A Modern Approach',
      'For sale: Artificial Intelligence: A Modern Approach',
      'I am selling my AI textbook because I finished the course. The corners are worn, but every chapter and diagram is complete. It is a useful reference for search, agents, and machine-learning foundations.'
    ),
    (
      'cmock_os_concepts_20260621',
      'nam@bookbridge.local',
      'HUST',
      'Operating System Concepts',
      'For sale: Operating System Concepts',
      'Selling my Operating System Concepts textbook for another student to use next semester. The book is in good condition and works well for operating-systems coursework.'
    ),
    (
      'cmock_psych_money_20260621',
      'mai@bookbridge.local',
      'FTU Readers',
      'The Psychology of Money',
      'For sale: The Psychology of Money',
      'I have an unread copy available for 45,000 VND. It is a practical book about financial behavior and long-term decision-making. Happy to meet near FTU for the handoff.'
    ),
    (
      'cmock_the_gene_20260621',
      'minh@bookbridge.local',
      'Non-fiction Vietnam',
      'The Gene',
      'For sale: The Gene',
      'Passing on my copy of The Gene after finishing it. It has a few useful sticky tabs but no damaged pages. A good choice for readers interested in science and medical history.'
    ),
    (
      'cmock_tomorrow_20260621',
      'mai@bookbridge.local',
      'Book News & Discoveries',
      'Tomorrow, and Tomorrow, and Tomorrow',
      'Open to exchange: Tomorrow, and Tomorrow, and Tomorrow',
      'I recently finished this novel and would like it to find another reader. I am especially interested in exchanging it for contemporary fiction or a memoir.'
    )
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
  seed."id",
  community."id",
  author."id",
  listing."id",
  seed."postTitle",
  seed."postBody",
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "listing_post_seeds" seed
JOIN "User" author
  ON author."email" = seed."email"
JOIN "Community" community
  ON community."name" = seed."communityName"
JOIN "Listing" listing
  ON listing."title" = seed."listingTitle"
  AND listing."ownerId" = author."id"
  AND listing."status" = 'ACTIVE'
WHERE NOT EXISTS (
  SELECT 1
  FROM "CommunityPost" existing
  WHERE existing."communityId" = community."id"
    AND existing."title" = seed."postTitle"
);
