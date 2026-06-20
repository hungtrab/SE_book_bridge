CREATE TYPE "CommunityPostKind" AS ENUM ('MEMBER', 'BULLETIN');
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY');

ALTER TABLE "CommunityPost"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "kind" "CommunityPostKind" NOT NULL DEFAULT 'MEMBER',
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "CommunityPostLike"
  ADD COLUMN "reaction" "ReactionType" NOT NULL DEFAULT 'LIKE';

ALTER TABLE "CommunityPostComment"
  ADD COLUMN "parentId" TEXT;

ALTER TABLE "CommunityPostComment"
  ADD CONSTRAINT "CommunityPostComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "CommunityPostComment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CommunityCommentReaction" (
  "userId" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "reaction" "ReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityCommentReaction_pkey" PRIMARY KEY ("userId", "commentId")
);

ALTER TABLE "CommunityCommentReaction"
  ADD CONSTRAINT "CommunityCommentReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityCommentReaction"
  ADD CONSTRAINT "CommunityCommentReaction_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "CommunityPostComment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CommunityPost_kind_publishedAt_idx" ON "CommunityPost"("kind", "publishedAt");
CREATE UNIQUE INDEX "CommunityPost_sourceName_externalId_key" ON "CommunityPost"("sourceName", "externalId");
CREATE INDEX "CommunityPostComment_parentId_createdAt_idx" ON "CommunityPostComment"("parentId", "createdAt");
CREATE INDEX "CommunityCommentReaction_commentId_idx" ON "CommunityCommentReaction"("commentId");
