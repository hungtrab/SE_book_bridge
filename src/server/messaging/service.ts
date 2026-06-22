import type { User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { BadRequestError, ForbiddenError, NotFoundError } from "../lib/errors";
import { dispatchNotifications } from "../notifications/dispatcher";

export const MessageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
export const DirectConversationSchema = z.object({ userId: z.string().min(1) });
export function isConversationParticipant(userId: string, userAId: string, userBId: string): boolean { return userId === userAId || userId === userBId; }

export async function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, displayName: true, avatarUrl: true } },
      userB: { select: { id: true, displayName: true, avatarUrl: true } },
      transaction: { select: { id: true, status: true, listing: { select: { id: true, title: true } } } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          messages: { where: { senderId: { not: userId }, readAt: null } },
        },
      },
    },
    orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
}

export async function unreadMessageCount(userId: string) {
  return prisma.message.count({
    where: {
      senderId: { not: userId },
      readAt: null,
      conversation: { OR: [{ userAId: userId }, { userBId: userId }] },
    },
  });
}

export async function createDirectConversation(user: User, otherUserId: string) {
  if (user.id === otherUserId) throw new BadRequestError("You cannot message yourself");
  const other = await prisma.user.findFirst({
    where: { id: otherUserId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!other) throw new NotFoundError("User not found");
  const [userAId, userBId] = [user.id, otherUserId].sort();
  const existing = await prisma.conversation.findFirst({
    where: { userAId, userBId, transactionId: null },
    select: { id: true },
  });
  if (existing) return existing;
  return prisma.conversation.create({
    data: { userAId, userBId },
    select: { id: true },
  });
}

export async function getMessages(user: User, conversationId: string, after?: Date) {
  const conversation = await requireParticipant(user, conversationId);
  const messages = await prisma.message.findMany({
    where: { conversationId, ...(after ? { createdAt: { gt: after } } : {}) },
    include: { sender: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: "asc" }, take: 100,
  });
  await prisma.message.updateMany({ where: { conversationId, senderId: { not: user.id }, readAt: null }, data: { readAt: new Date() } });
  return { conversation, messages };
}

export async function sendMessage(user: User, conversationId: string, input: z.infer<typeof MessageSchema>) {
  const data = MessageSchema.parse(input);
  const conversation = await requireParticipant(user, conversationId);
  const recipientId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { conversationId, senderId: user.id, body: data.body },
      include: { sender: { select: { id: true, displayName: true } } },
    });
    await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: message.createdAt } });
    await dispatchNotifications(tx, {
      kind: "message.created",
      actorId: user.id,
      conversationId,
      messageId: message.id,
      recipientId,
    });
    return message;
  });
}

async function requireParticipant(user: User, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { userA: { select: { id: true, displayName: true } }, userB: { select: { id: true, displayName: true } }, transaction: { select: { id: true, status: true } } },
  });
  if (!conversation) throw new NotFoundError("Conversation not found");
  if (!isConversationParticipant(user.id, conversation.userAId, conversation.userBId) && user.role !== "MODERATOR" && user.role !== "ADMIN") throw new ForbiddenError();
  return conversation;
}
