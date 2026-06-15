-- Community engagement: likes, comments, new notification kinds

-- 1. Denormalized counters on CommunityPost
ALTER TABLE "CommunityPost" ADD COLUMN "likeCount"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CommunityPost" ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0;

-- 2. Post likes
CREATE TABLE "CommunityPostLike" (
  "userId"    TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityPostLike_pkey" PRIMARY KEY ("userId", "postId")
);

ALTER TABLE "CommunityPostLike"
  ADD CONSTRAINT "CommunityPostLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPostLike"
  ADD CONSTRAINT "CommunityPostLike_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "CommunityPost"(id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CommunityPostLike_postId_idx" ON "CommunityPostLike"("postId");

-- 3. Post comments
CREATE TABLE "CommunityPostComment" (
  "id"        TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityPostComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CommunityPostComment"
  ADD CONSTRAINT "CommunityPostComment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "CommunityPost"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPostComment"
  ADD CONSTRAINT "CommunityPostComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CommunityPostComment_postId_createdAt_idx" ON "CommunityPostComment"("postId", "createdAt");
CREATE INDEX "CommunityPostComment_authorId_idx"          ON "CommunityPostComment"("authorId");

-- 4. New NotificationKind enum values
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'COMMUNITY_POST_CREATED';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'COMMUNITY_POST_LIKED';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'COMMUNITY_POST_COMMENTED';
