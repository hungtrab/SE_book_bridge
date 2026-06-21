import { z } from "zod";

import { ForbiddenError, NotFoundError } from "../lib/errors";
import { prisma } from "../lib/prisma";

const ARTIFACT_SLUGS = new Set(["the-alchemist", "tuc-nuoc-vo-bo"]);

export const ArtifactCommentSchema = z.object({
  body: z.string().trim().min(2).max(1200),
});

export function assertArtifactSlug(slug: string) {
  if (!ARTIFACT_SLUGS.has(slug)) throw new NotFoundError("Artifact not found");
}

export async function listArtifactComments(
  artifactSlug: string,
  sort: "newest" | "liked" = "newest",
  viewerId?: string,
) {
  assertArtifactSlug(artifactSlug);
  return prisma.artifactComment.findMany({
    where: { artifactSlug },
    include: {
      author: { select: { id: true, displayName: true, avatarUrl: true, reputationTier: true } },
      likes: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
    },
    orderBy: sort === "liked"
      ? [{ likeCount: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }],
    take: 100,
  });
}

export async function createArtifactComment(artifactSlug: string, authorId: string, body: string) {
  assertArtifactSlug(artifactSlug);
  const data = ArtifactCommentSchema.parse({ body });
  return prisma.artifactComment.create({
    data: { artifactSlug, authorId, body: data.body },
    include: {
      author: { select: { id: true, displayName: true, avatarUrl: true, reputationTier: true } },
      likes: { where: { userId: authorId }, select: { userId: true } },
    },
  });
}

export async function deleteArtifactComment(commentId: string, userId: string, canModerate: boolean) {
  const comment = await prisma.artifactComment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });
  if (!comment) throw new NotFoundError("Comment not found");
  if (comment.authorId !== userId && !canModerate) throw new ForbiddenError();
  await prisma.artifactComment.delete({ where: { id: commentId } });
  return { ok: true };
}

export async function setArtifactCommentLike(commentId: string, userId: string, active: boolean) {
  const comment = await prisma.artifactComment.findUnique({ where: { id: commentId }, select: { id: true } });
  if (!comment) throw new NotFoundError("Comment not found");
  return prisma.$transaction(async (tx) => {
    const existing = await tx.artifactCommentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (active && !existing) {
      await tx.artifactCommentLike.create({ data: { userId, commentId } });
      await tx.artifactComment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } });
    } else if (!active && existing) {
      await tx.artifactCommentLike.delete({ where: { userId_commentId: { userId, commentId } } });
      await tx.artifactComment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } });
    }
    const updated = await tx.artifactComment.findUniqueOrThrow({
      where: { id: commentId },
      select: { likeCount: true },
    });
    return { active, count: Math.max(0, updated.likeCount) };
  });
}
