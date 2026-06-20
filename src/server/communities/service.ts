import type { User } from "@prisma/client";
import { z } from "zod";
import { randomBytes } from "crypto";

import { prisma } from "../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";
import { fanoutExistingListingsToUser } from "../feed/fanout";
import { dispatchNotifications } from "../notifications/dispatcher";

export const MAX_COMMUNITIES_PER_USER = 20;

export const CommunityCreateSchema = z.object({
  name: z.string().trim().min(2).max(64),
  scope: z.enum(["UNIVERSITY", "LOCATION", "GENRE"]),
  description: z.string().trim().max(500).optional(),
  isPrivate: z.boolean().optional().default(false),
});

export const CommunityQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  scope: z.enum(["UNIVERSITY", "LOCATION", "GENRE"]).optional(),
});

export const CommunityModeratorGrantSchema = z.object({
  email: z.string().trim().email(),
});

export const CommunityPostCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  imageUrl: z.string().url().max(1000).optional(),
  isPinned: z.boolean().optional().default(false),
});

export const JoinByCodeSchema = z.object({
  code: z.string().trim().min(1),
});

export const CommunityPostCommentCreateSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentId: z.string().trim().min(1).optional(),
});

export const ReactionSchema = z.object({
  reaction: z.enum(["LIKE", "LOVE", "CARE", "HAHA", "WOW", "SAD", "ANGRY"]),
});

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function canJoinCommunity(currentCount: number): boolean {
  return currentCount < MAX_COMMUNITIES_PER_USER;
}

function assertCommunityMod(actor: User, community: { ownerId: string; id: string }, membership: { role: string } | null | undefined) {
  const isMod = membership?.role === "MODERATOR";
  const isOwner = community.ownerId === actor.id;
  const isAdmin = actor.role === "ADMIN";
  if (!isMod && !isOwner && !isAdmin) {
    throw new ForbiddenError("Only community moderators or admins can perform this action");
  }
}

export async function listCommunities(input: z.infer<typeof CommunityQuerySchema>, userId?: string) {
  const data = CommunityQuerySchema.parse(input);
  return prisma.community.findMany({
    where: {
      name: { not: process.env.BULLETIN_COMMUNITY_NAME ?? "Book News & Discoveries" },
      ...(data.scope ? { scope: data.scope } : {}),
      ...(data.q
        ? {
            OR: [
              { name: { contains: data.q, mode: "insensitive" } },
              { description: { contains: data.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: userId
      ? { memberships: { where: { userId }, select: { role: true } } }
      : undefined,
    orderBy: [{ memberCount: "desc" }, { name: "asc" }],
    take: 100,
  });
}

export async function getCommunity(id: string, userId?: string) {
  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, displayName: true } },
      memberships: {
        take: 50,
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      },
      listings: {
        where: { status: "ACTIVE" },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { photos: { take: 1, orderBy: { position: "asc" } } },
      },
      posts: {
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 20,
        include: {
          author: { select: { id: true, displayName: true, avatarUrl: true } },
          comments: {
            where: { parentId: null },
            take: 10,
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, displayName: true, avatarUrl: true } },
              reactions: { select: { userId: true, reaction: true } },
              replies: {
                take: 5,
                orderBy: { createdAt: "asc" },
                include: {
                  author: { select: { id: true, displayName: true, avatarUrl: true } },
                  reactions: { select: { userId: true, reaction: true } },
                },
              },
            },
          },
          likes: { select: { userId: true, reaction: true } },
        },
      },
    },
  });
  if (!community) throw new NotFoundError("Community not found");

  const myMembership = userId
    ? community.memberships.find((m) => m.userId === userId) ?? null
    : null;

  // Private communities: only members can see full details
  if (community.isPrivate && !myMembership && userId !== community.ownerId) {
    return {
      id: community.id,
      name: community.name,
      scope: community.scope,
      description: community.description,
      memberCount: community.memberCount,
      isPrivate: true,
      ownerId: community.ownerId,
      owner: community.owner,
      createdAt: community.createdAt,
      memberships: [],
      listings: [],
      posts: [],
      myMembership: null,
      inviteCode: null,
    };
  }

  return {
    ...community,
    myMembership,
  };
}

export async function createCommunity(user: User, input: z.infer<typeof CommunityCreateSchema>) {
  const data = CommunityCreateSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const count = await tx.communityMembership.count({ where: { userId: user.id } });
    if (!canJoinCommunity(count)) throw new ConflictError("You can join at most 20 communities");
    const existing = await tx.community.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictError("A community with this name already exists");

    const inviteCode = generateInviteCode();

    return tx.community.create({
      data: {
        ownerId: user.id,
        name: data.name,
        scope: data.scope,
        description: data.description,
        isPrivate: data.isPrivate,
        inviteCode,
        memberCount: 1,
        memberships: { create: { userId: user.id, role: "MODERATOR" } },
      },
    });
  });
}

export async function joinCommunity(userId: string, communityId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (community.isPrivate) throw new ForbiddenError("This community is private — use an invite code to join");
    const existing = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (existing) return { joined: true };
    const count = await tx.communityMembership.count({ where: { userId } });
    if (!canJoinCommunity(count)) throw new ConflictError("You can join at most 20 communities");
    await tx.communityMembership.create({ data: { userId, communityId } });
    await tx.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } });
    await fanoutExistingListingsToUser(tx, userId, { communityId });
    return { joined: true };
  });
}

export async function joinCommunityByCode(userId: string, code: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { inviteCode: code.toUpperCase() } });
    if (!community) throw new NotFoundError("Invalid invite code");
    const existing = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId, communityId: community.id } },
    });
    if (existing) return { joined: true, communityId: community.id };
    const count = await tx.communityMembership.count({ where: { userId } });
    if (!canJoinCommunity(count)) throw new ConflictError("You can join at most 20 communities");
    await tx.communityMembership.create({ data: { userId, communityId: community.id } });
    await tx.community.update({ where: { id: community.id }, data: { memberCount: { increment: 1 } } });
    await fanoutExistingListingsToUser(tx, userId, { communityId: community.id });
    return { joined: true, communityId: community.id };
  });
}

export async function leaveCommunity(userId: string, communityId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (community.ownerId === userId) throw new ForbiddenError("Community owner cannot leave");
    const deleted = await tx.communityMembership.deleteMany({ where: { userId, communityId } });
    if (deleted.count > 0) {
      await tx.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      });
    }
    return { joined: false };
  });
}

export async function deleteCommunity(actor: User, communityId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (community.ownerId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("Only the community owner or an admin can delete this community");
    }
    await tx.community.delete({ where: { id: communityId } });
    return { deleted: true };
  });
}

export async function grantCommunityModerator(
  actor: User,
  communityId: string,
  input: z.infer<typeof CommunityModeratorGrantSchema>,
) {
  const data = CommunityModeratorGrantSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (community.ownerId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("Only the community owner or an admin can grant moderator access");
    }

    const target = await tx.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true, displayName: true, email: true },
    });
    if (!target) throw new NotFoundError("User not found");

    const existing = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: target.id, communityId } },
    });
    await tx.communityMembership.upsert({
      where: { userId_communityId: { userId: target.id, communityId } },
      create: { userId: target.id, communityId, role: "MODERATOR" },
      update: { role: "MODERATOR" },
    });
    if (!existing) {
      await tx.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      });
      await fanoutExistingListingsToUser(tx, target.id, { communityId });
    }
    return { userId: target.id, displayName: target.displayName, role: "MODERATOR" as const };
  });
}

export async function revokeCommunityModerator(actor: User, communityId: string, targetUserId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (community.ownerId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("Only the community owner or an admin can revoke moderator access");
    }
    if (targetUserId === community.ownerId) throw new ForbiddenError("Cannot demote the community owner");
    await tx.communityMembership.update({
      where: { userId_communityId: { userId: targetUserId, communityId } },
      data: { role: "MEMBER" },
    });
    return { userId: targetUserId, role: "MEMBER" as const };
  });
}

export async function removeMember(actor: User, communityId: string, targetUserId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    const actorMembership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: actor.id, communityId } },
    });
    assertCommunityMod(actor, community, actorMembership);
    if (targetUserId === community.ownerId) throw new ForbiddenError("Cannot remove the community owner");
    const deleted = await tx.communityMembership.deleteMany({ where: { userId: targetUserId, communityId } });
    if (deleted.count > 0) {
      await tx.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } });
    }
    return { removed: true };
  });
}

export async function regenerateInviteCode(actor: User, communityId: string) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new NotFoundError("Community not found");
  if (community.ownerId !== actor.id && actor.role !== "ADMIN") {
    throw new ForbiddenError("Only the community owner or an admin can regenerate the invite code");
  }
  const inviteCode = generateInviteCode();
  await prisma.community.update({ where: { id: communityId }, data: { inviteCode } });
  return { inviteCode };
}

export async function createCommunityPost(
  actor: User,
  communityId: string,
  input: z.infer<typeof CommunityPostCreateSchema>,
) {
  const data = CommunityPostCreateSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    const membership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: actor.id, communityId } },
    });
    if (!membership && community.ownerId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("You must be a member to post in this community");
    }
    // Only mods/owner/admin can pin
    if (data.isPinned) {
      assertCommunityMod(actor, community, membership);
    }
    const post = await tx.communityPost.create({
      data: {
        communityId,
        authorId: actor.id,
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        isPinned: data.isPinned,
      },
      include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    // Award community points to the author for posting
    await tx.communityMembership.updateMany({
      where: { userId: actor.id, communityId },
      data: { communityPoints: { increment: 5 } },
    });
    // Notify all community members about the new post
    const memberIds = await tx.communityMembership.findMany({
      where: { communityId },
      select: { userId: true },
    });
    await dispatchNotifications(tx, {
      kind: "community.post_created",
      actorId: actor.id,
      communityId,
      communityName: community.name,
      postId: post.id,
      postTitle: post.title,
      recipientIds: memberIds.map((m) => m.userId),
    });
    return post;
  });
}

export async function deleteCommunityPost(actor: User, communityId: string, postId: string) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.communityId !== communityId) throw new NotFoundError("Post not found");
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    const membership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: actor.id, communityId } },
    });
    const isAuthor = post.authorId === actor.id;
    const isMod = membership?.role === "MODERATOR" || community.ownerId === actor.id || actor.role === "ADMIN";
    if (!isAuthor && !isMod) throw new ForbiddenError("Cannot delete this post");
    await tx.communityPost.delete({ where: { id: postId } });
    return { deleted: true };
  });
}

export async function pinCommunityPost(actor: User, communityId: string, postId: string, pinned: boolean) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    const membership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: actor.id, communityId } },
    });
    assertCommunityMod(actor, community, membership);
    const post = await tx.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.communityId !== communityId) throw new NotFoundError("Post not found");
    await tx.communityPost.update({ where: { id: postId }, data: { isPinned: pinned } });
    return { pinned };
  });
}

export async function grantCommunityModeratorById(actor: User, communityId: string, targetUserId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (community.ownerId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("Only the community owner or an admin can grant moderator access");
    }
    if (targetUserId === community.ownerId) throw new ForbiddenError("Owner already has full permissions");
    const existing = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: targetUserId, communityId } },
    });
    await tx.communityMembership.upsert({
      where: { userId_communityId: { userId: targetUserId, communityId } },
      create: { userId: targetUserId, communityId, role: "MODERATOR" },
      update: { role: "MODERATOR" },
    });
    if (!existing) {
      await tx.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } });
      await fanoutExistingListingsToUser(tx, targetUserId, { communityId });
    }
    return { userId: targetUserId, role: "MODERATOR" as const };
  });
}

export async function reactToPost(
  actor: User,
  communityId: string,
  postId: string,
  input: z.infer<typeof ReactionSchema>,
) {
  const data = ReactionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const post = await tx.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.communityId !== communityId) throw new NotFoundError("Post not found");
    if (post.kind !== "BULLETIN") {
      const membership = await tx.communityMembership.findUnique({
        where: { userId_communityId: { userId: actor.id, communityId } },
      });
      if (!membership && actor.role !== "ADMIN") throw new ForbiddenError("Join the community to react");
    }

    const existing = await tx.communityPostLike.findUnique({
      where: { userId_postId: { userId: actor.id, postId } },
    });

    if (existing?.reaction === data.reaction) {
      await tx.communityPostLike.delete({ where: { userId_postId: { userId: actor.id, postId } } });
      await tx.communityPost.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      await tx.communityMembership.updateMany({
        where: { userId: actor.id, communityId },
        data: { communityPoints: { decrement: 2 } },
      });
      return { reacted: false, reaction: null, likeCount: Math.max(0, post.likeCount - 1) };
    }

    await tx.communityPostLike.upsert({
      where: { userId_postId: { userId: actor.id, postId } },
      create: { userId: actor.id, postId, reaction: data.reaction },
      update: { reaction: data.reaction },
    });
    if (!existing) {
      await tx.communityPost.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
      await tx.communityMembership.updateMany({
        where: { userId: actor.id, communityId },
        data: { communityPoints: { increment: 2 } },
      });
    }

    if (post.authorId !== actor.id) {
      await dispatchNotifications(tx, {
        kind: "community.post_liked",
        actorId: actor.id,
        postId,
        postTitle: post.title,
        authorId: post.authorId,
      });
    }

    return { reacted: true, reaction: data.reaction, likeCount: post.likeCount + (existing ? 0 : 1) };
  });
}

export async function createComment(
  actor: User,
  communityId: string,
  postId: string,
  input: z.infer<typeof CommunityPostCommentCreateSchema>,
) {
  const data = CommunityPostCommentCreateSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const post = await tx.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.communityId !== communityId) throw new NotFoundError("Post not found");
    const membership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: actor.id, communityId } },
    });
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (!membership && post.kind !== "BULLETIN" && community.ownerId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenError("You must be a member to comment");
    }
    if (data.parentId) {
      const parent = await tx.communityPostComment.findUnique({
        where: { id: data.parentId },
        select: { postId: true, parentId: true },
      });
      if (!parent || parent.postId !== postId) throw new NotFoundError("Parent comment not found");
      if (parent.parentId) throw new ConflictError("Replies can only be nested one level");
    }

    const comment = await tx.communityPostComment.create({
      data: { postId, authorId: actor.id, body: data.body, parentId: data.parentId },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        reactions: { select: { userId: true, reaction: true } },
        replies: true,
      },
    });
    await tx.communityPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
    await tx.communityMembership.updateMany({
      where: { userId: actor.id, communityId },
      data: { communityPoints: { increment: 3 } },
    });

    if (post.authorId !== actor.id) {
      await dispatchNotifications(tx, {
        kind: "community.post_commented",
        actorId: actor.id,
        postId,
        postTitle: post.title,
        communityId,
        authorId: post.authorId,
        commentId: comment.id,
      });
    }

    return comment;
  });
}

export async function reactToComment(
  actor: User,
  communityId: string,
  postId: string,
  commentId: string,
  input: z.infer<typeof ReactionSchema>,
) {
  const data = ReactionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const comment = await tx.communityPostComment.findUnique({
      where: { id: commentId },
      select: { postId: true },
    });
    if (!comment || comment.postId !== postId) throw new NotFoundError("Comment not found");
    const membership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: actor.id, communityId } },
    });
    const post = await tx.communityPost.findUnique({ where: { id: postId }, select: { kind: true } });
    if (!post) throw new NotFoundError("Post not found");
    if (!membership && post.kind !== "BULLETIN" && actor.role !== "ADMIN") throw new ForbiddenError("Join the community to react");
    const existing = await tx.communityCommentReaction.findUnique({
      where: { userId_commentId: { userId: actor.id, commentId } },
    });
    if (existing?.reaction === data.reaction) {
      await tx.communityCommentReaction.delete({
        where: { userId_commentId: { userId: actor.id, commentId } },
      });
      return { reacted: false, reaction: null };
    }
    await tx.communityCommentReaction.upsert({
      where: { userId_commentId: { userId: actor.id, commentId } },
      create: { userId: actor.id, commentId, reaction: data.reaction },
      update: { reaction: data.reaction },
    });
    return { reacted: true, reaction: data.reaction };
  });
}

export async function deleteComment(actor: User, communityId: string, postId: string, commentId: string) {
  return prisma.$transaction(async (tx) => {
    const comment = await tx.communityPostComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.postId !== postId) throw new NotFoundError("Comment not found");
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    const membership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: actor.id, communityId } },
    });
    const isAuthor = comment.authorId === actor.id;
    const isMod = membership?.role === "MODERATOR" || community.ownerId === actor.id || actor.role === "ADMIN";
    if (!isAuthor && !isMod) throw new ForbiddenError("Cannot delete this comment");
    await tx.communityPostComment.delete({ where: { id: commentId } });
    await tx.communityPost.update({ where: { id: postId }, data: { commentCount: { decrement: 1 } } });
    return { deleted: true };
  });
}
