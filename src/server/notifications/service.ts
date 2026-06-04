import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import { z } from "zod";

export const NotificationPreferenceSchema = z.object({
  emailPreference: z.enum(["IMMEDIATE", "DAILY", "OFF"]),
});

export async function listNotifications(userId: string, cursor?: string, pageSize = 30) {
  const size = Math.min(Math.max(pageSize, 1), 50);
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: size + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });
  return {
    items: rows.slice(0, size),
    nextCursor: rows.length > size ? rows[size].id : null,
  };
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(userId: string, id: string) {
  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError("Notification not found");
  return { ok: true };
}

export async function notificationsAfter(userId: string, after: Date) {
  return prisma.notification.findMany({
    where: { userId, createdAt: { gt: after } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function getNotificationPreference(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { notificationEmailPreference: true },
  });
}

export async function setNotificationPreference(
  userId: string,
  input: z.infer<typeof NotificationPreferenceSchema>,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { notificationEmailPreference: input.emailPreference },
    select: { notificationEmailPreference: true },
  });
}
