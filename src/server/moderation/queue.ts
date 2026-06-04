import type { User } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { ForbiddenError } from "../lib/errors";

export async function listModerationQueue(user: User, status: "PENDING" | "RESOLVED" | "REJECTED" = "PENDING") {
  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    return prisma.report.findMany({ where: { status }, include: reportInclude(), orderBy: { createdAt: "asc" } });
  }
  const memberships = await prisma.communityMembership.findMany({
    where: { userId: user.id, role: "MODERATOR" },
    select: { communityId: true },
  });
  if (memberships.length === 0) throw new ForbiddenError("Moderator access required");
  return prisma.report.findMany({
    where: {
      status,
      targetListing: { communityId: { in: memberships.map((membership) => membership.communityId) } },
    },
    include: reportInclude(),
    orderBy: { createdAt: "asc" },
  });
}

export async function hasModerationAccess(user: User) {
  if (user.role === "ADMIN" || user.role === "MODERATOR") return true;
  return Boolean(await prisma.communityMembership.findFirst({
    where: { userId: user.id, role: "MODERATOR" },
    select: { userId: true },
  }));
}

export async function canModerateReport(user: User, reportId: string) {
  if (user.role === "ADMIN" || user.role === "MODERATOR") return true;
  return Boolean(await prisma.report.findFirst({
    where: {
      id: reportId,
      targetListing: { community: { memberships: { some: { userId: user.id, role: "MODERATOR" } } } },
    },
    select: { id: true },
  }));
}

function reportInclude() {
  return {
    filer: { select: { id: true, displayName: true } },
    targetUser: { select: { id: true, displayName: true, status: true } },
    targetListing: { select: { id: true, title: true, status: true, ownerId: true, communityId: true } },
    targetTransaction: { select: { id: true, status: true, ownerId: true, requesterId: true } },
    targetMessage: { select: { id: true, body: true, senderId: true } },
    actions: { include: { byUser: { select: { displayName: true } } }, orderBy: { createdAt: "desc" as const } },
  };
}
