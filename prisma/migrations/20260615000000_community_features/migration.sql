-- Community features migration
-- 1. Add isPrivate + inviteCode to Community
ALTER TABLE "Community" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Community" ADD COLUMN "inviteCode" TEXT;
CREATE UNIQUE INDEX "Community_inviteCode_key" ON "Community"("inviteCode");

-- 2. Add communityPoints to CommunityMembership
ALTER TABLE "CommunityMembership" ADD COLUMN "communityPoints" INTEGER NOT NULL DEFAULT 0;

-- 3. CommunityPost model
CREATE TABLE "CommunityPost" (
  "id"          TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "authorId"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "pinned"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CommunityPost"
  ADD CONSTRAINT "CommunityPost_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost"
  ADD CONSTRAINT "CommunityPost_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CommunityPost_communityId_createdAt_idx" ON "CommunityPost"("communityId", "createdAt");
