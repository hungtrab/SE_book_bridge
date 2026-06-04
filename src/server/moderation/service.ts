import type { ModerationActionKind, Prisma, ReportTargetType, User } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";
import { dispatchNotifications } from "../notifications/dispatcher";
import { addReputationEvent } from "../reputation/service";
import { ReputationWeights } from "../reputation/scoring";
import { applyTransactionActionInTx } from "../transactions/service";
import { canModerateReport } from "./queue";

export const ReportSchema = z.object({
  targetType: z.enum(["USER", "LISTING", "TRANSACTION", "MESSAGE"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(2000).optional(),
});

export const ModerationActionSchema = z.object({
  action: z.enum(["WARN", "REMOVE_LISTING", "SUSPEND_USER", "RESTORE", "RESOLVE_DISPUTE", "REJECT_DISPUTE", "REJECT_REPORT"]),
  notes: z.string().trim().min(3).max(2000),
});

export async function fileReport(user: User, input: z.infer<typeof ReportSchema>) {
  const data = ReportSchema.parse(input);
  const target = await resolveTarget(user, data.targetType, data.targetId);
  if (target.targetUserId === user.id) throw new BadRequestError("You cannot report yourself");
  const duplicate = await prisma.report.findFirst({
    where: {
      filerId: user.id,
      status: "PENDING",
      targetType: data.targetType,
      ...target.where,
    },
    select: { id: true },
  });
  if (duplicate) throw new ConflictError("You already have a pending report for this target");
  return prisma.report.create({
    data: {
      filerId: user.id,
      targetType: data.targetType,
      reason: data.reason,
      details: data.details,
      ...target.data,
    },
  });
}

export async function listMyReports(userId: string) {
  return prisma.report.findMany({
    where: { filerId: userId },
    include: { actions: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function applyModerationAction(
  moderator: User,
  reportId: string,
  input: z.infer<typeof ModerationActionSchema>,
) {
  const data = ModerationActionSchema.parse(input);
  if (!(await canModerateReport(moderator, reportId))) throw new ForbiddenError("Moderator access required");
  if (!canCommunityModeratorApplyAction(moderator.role, data.action)) {
    throw new ForbiddenError("Community moderators cannot apply global account actions");
  }
  return prisma.$transaction(async (tx) => {
    const report = await tx.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundError("Report not found");
    if (report.status !== "PENDING") throw new ConflictError("Report is already resolved");
    const targetUserId = await moderationTargetUser(tx, report);
    assertActionCompatible(data.action, report);

    if (data.action === "REMOVE_LISTING") {
      await tx.listing.update({ where: { id: report.targetListingId! }, data: { status: "REMOVED" } });
    } else if (data.action === "SUSPEND_USER") {
      await tx.user.update({ where: { id: targetUserId! }, data: { status: "SUSPENDED" } });
    } else if (data.action === "RESTORE") {
      if (report.targetListingId) {
        await tx.listing.update({ where: { id: report.targetListingId }, data: { status: "ACTIVE" } });
      } else if (targetUserId) {
        await tx.user.update({ where: { id: targetUserId }, data: { status: "ACTIVE" } });
      }
    } else if (data.action === "RESOLVE_DISPUTE" || data.action === "REJECT_DISPUTE") {
      await applyTransactionActionInTx(
        tx,
        moderator,
        report.targetTransactionId!,
        { kind: data.action === "RESOLVE_DISPUTE" ? "moderate-resolve" : "moderate-reject", actor: "moderator" },
        { reason: data.notes },
      );
    }
    const rejected = data.action === "REJECT_REPORT";
    const upheld = data.action === "WARN" || data.action === "REMOVE_LISTING" || data.action === "SUSPEND_USER";
    if (upheld && targetUserId) {
      await addReputationEvent(tx, {
        userId: targetUserId,
        kind: "REPORT_UPHELD",
        delta: ReputationWeights.REPORT_UPHELD,
        context: { reportId, action: data.action },
        actorId: moderator.id,
      });
    }
    const action = await tx.moderationAction.create({
      data: { reportId, byUserId: moderator.id, onUserId: targetUserId, kind: data.action, notes: data.notes },
    });
    await tx.report.update({
      where: { id: reportId },
      data: { status: rejected ? "REJECTED" : "RESOLVED", resolvedAt: new Date() },
    });
    if (targetUserId) {
      await dispatchNotifications(tx, {
        kind: "moderation.action",
        actorId: moderator.id,
        userId: targetUserId,
        reportId,
        action: data.action,
      });
    }
    return action;
  });
}

export function canCommunityModeratorApplyAction(role: User["role"], action: ModerationActionKind) {
  return role === "ADMIN"
    || role === "MODERATOR"
    || action === "WARN"
    || action === "REMOVE_LISTING"
    || action === "REJECT_REPORT";
}

async function resolveTarget(user: User, targetType: ReportTargetType, targetId: string) {
  if (targetType === "USER") {
    const row = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!row) throw new NotFoundError("Target user not found");
    return { data: { targetUserId: row.id }, where: { targetUserId: row.id }, targetUserId: row.id };
  }
  if (targetType === "LISTING") {
    const row = await prisma.listing.findUnique({ where: { id: targetId }, select: { id: true, ownerId: true } });
    if (!row) throw new NotFoundError("Target listing not found");
    return {
      data: { targetListingId: row.id, targetUserId: row.ownerId },
      where: { targetListingId: row.id },
      targetUserId: row.ownerId,
    };
  }
  if (targetType === "TRANSACTION") {
    const row = await prisma.transaction.findUnique({
      where: { id: targetId },
      select: { id: true, ownerId: true, requesterId: true },
    });
    if (!row) throw new NotFoundError("Target transaction not found");
    if (user.id !== row.ownerId && user.id !== row.requesterId) throw new ForbiddenError("You cannot report this transaction");
    const targetUserId = user.id === row.ownerId ? row.requesterId : row.ownerId;
    return {
      data: { targetTransactionId: row.id, targetUserId },
      where: { targetTransactionId: row.id },
      targetUserId,
    };
  }
  const row = await prisma.message.findUnique({
    where: { id: targetId },
    select: { id: true, senderId: true, conversation: { select: { userAId: true, userBId: true } } },
  });
  if (!row) throw new NotFoundError("Target message not found");
  if (user.id !== row.conversation.userAId && user.id !== row.conversation.userBId) {
    throw new ForbiddenError("You cannot report this message");
  }
  if (user.id === row.senderId) throw new BadRequestError("You cannot report your own message");
  return {
    data: { targetMessageId: row.id, targetUserId: row.senderId },
    where: { targetMessageId: row.id },
    targetUserId: row.senderId,
  };
}

async function moderationTargetUser(tx: Prisma.TransactionClient, report: {
  targetUserId: string | null;
  targetListingId: string | null;
  targetTransactionId: string | null;
  targetMessageId: string | null;
}) {
  if (report.targetUserId) return report.targetUserId;
  if (report.targetListingId) return (await tx.listing.findUniqueOrThrow({ where: { id: report.targetListingId }, select: { ownerId: true } })).ownerId;
  if (report.targetMessageId) return (await tx.message.findUniqueOrThrow({ where: { id: report.targetMessageId }, select: { senderId: true } })).senderId;
  return null;
}

function assertActionCompatible(action: ModerationActionKind, report: {
  targetListingId: string | null;
  targetUserId: string | null;
  targetTransactionId?: string | null;
  targetMessageId: string | null;
}) {
  if (action === "REMOVE_LISTING" && !report.targetListingId) throw new BadRequestError("This report does not target a listing");
  if (action === "SUSPEND_USER" && !report.targetUserId && !report.targetListingId && !report.targetMessageId) {
    throw new BadRequestError("This report does not identify a user");
  }
  if (action === "RESTORE" && !report.targetListingId && !report.targetUserId) throw new BadRequestError("Nothing can be restored for this report");
  if ((action === "RESOLVE_DISPUTE" || action === "REJECT_DISPUTE") && !report.targetTransactionId) {
    throw new BadRequestError("This report does not target a transaction dispute");
  }
}
