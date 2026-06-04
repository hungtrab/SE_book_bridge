import { prisma } from "../lib/prisma";
import { autoCompleteTransaction } from "./service";

const DAY_MS = 86400000;
export type ScheduleDecision = "none" | "remind" | "auto-complete";
export function scheduleDecision(shippedAt: Date, now = new Date()): ScheduleDecision {
  const ageDays = (now.getTime() - shippedAt.getTime()) / DAY_MS;
  if (ageDays >= 21) return "auto-complete";
  if (ageDays >= 14) return "remind";
  return "none";
}
export async function runTransactionScheduler(now = new Date()) {
  const rows = await prisma.transaction.findMany({ where: { status: "IN_DELIVERY", shippedAt: { not: null } }, select: { id: true, requesterId: true, shippedAt: true } });
  let reminded = 0; let completed = 0;
  for (const txn of rows) {
    if (!txn.shippedAt) continue;
    const decision = scheduleDecision(txn.shippedAt, now);
    if (decision === "auto-complete") {
      const out = await autoCompleteTransaction(txn.id); if (!out.skipped) completed += 1;
    } else if (decision === "remind") {
      const existing = await prisma.notification.findFirst({ where: { userId: txn.requesterId, kind: "TRANSACTION_STATUS_CHANGED", AND: [{ payload: { path: ["transactionId"], equals: txn.id } }, { payload: { path: ["event"], equals: "delivery_confirmation_reminder" } }] } });
      if (!existing) {
        await prisma.notification.create({ data: { userId: txn.requesterId, kind: "TRANSACTION_STATUS_CHANGED", payload: { transactionId: txn.id, event: "delivery_confirmation_reminder" } } }); reminded += 1;
      }
    }
  }
  return { scanned: rows.length, reminded, completed };
}
