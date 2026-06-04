import { prisma } from "../lib/prisma";

export async function getPlatformStats() {
  const [
    activeUsers,
    completedTransactions,
    activeListings,
    communities,
    pendingReports,
    unreadNotifications,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({ where: { status: "COMPLETED" } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.community.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.notification.count({ where: { readAt: null } }),
  ]);
  return {
    activeUsers,
    completedTransactions,
    booksCirculated: completedTransactions,
    activeListings,
    communities,
    pendingReports,
    unreadNotifications,
    generatedAt: new Date(),
  };
}

export async function grantMetrics(from: Date, to: Date) {
  const [newUsers, completedTransactions, newListings, newCommunities] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.transaction.count({ where: { completedAt: { gte: from, lte: to } } }),
    prisma.listing.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.community.count({ where: { createdAt: { gte: from, lte: to } } }),
  ]);
  return { newUsers, completedTransactions, booksCirculated: completedTransactions, newListings, newCommunities };
}
