import nodemailer from "nodemailer";

import { prisma } from "../lib/prisma";

export function renderDigest(items: Array<{ kind: string; payload: unknown; createdAt: Date }>): string {
  return items
    .map((item) => `- ${item.kind} (${item.createdAt.toISOString()}): ${JSON.stringify(item.payload)}`)
    .join("\n");
}

export async function runDailyNotificationDigest(now = new Date()) {
  if (process.env.EMAIL_DIGEST_ENABLED !== "true") return { users: 0, notifications: 0, skipped: true };
  if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST is required for notification digest");

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      notificationEmailPreference: "DAILY",
      notifications: { some: { createdAt: { gte: since }, readAt: null, emailSentAt: null } },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      notifications: {
        where: { createdAt: { gte: since }, readAt: null, emailSentAt: null },
        orderBy: { createdAt: "asc" },
        select: { kind: true, payload: true, createdAt: true },
      },
    },
  });
  const transporter = createTransporter();
  for (const user of users) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "BookBridge <noreply@bookbridge.local>",
      to: user.email,
      subject: "Your BookBridge daily digest",
      text: `Hello ${user.displayName},\n\n${renderDigest(user.notifications)}`,
    });
    await prisma.notification.updateMany({
      where: { userId: user.id, createdAt: { gte: since }, readAt: null, emailSentAt: null },
      data: { emailSentAt: now },
    });
  }
  return {
    users: users.length,
    notifications: users.reduce((sum, user) => sum + user.notifications.length, 0),
    skipped: false,
  };
}

export async function runImmediateNotificationEmails(now = new Date()) {
  if (process.env.EMAIL_DIGEST_ENABLED !== "true") return { users: 0, notifications: 0, skipped: true };
  if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST is required for notification email");
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      notificationEmailPreference: "IMMEDIATE",
      notifications: { some: { emailSentAt: null, createdAt: { gte: since } } },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      notifications: {
        where: { emailSentAt: null, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
        take: 50,
        select: { id: true, kind: true, payload: true, createdAt: true },
      },
    },
  });
  const transporter = createTransporter();
  let count = 0;
  for (const user of users) {
    for (const notification of user.notifications) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? "BookBridge <noreply@bookbridge.local>",
        to: user.email,
        subject: `BookBridge: ${notification.kind}`,
        text: `Hello ${user.displayName},\n\n${renderDigest([notification])}`,
      });
      await prisma.notification.updateMany({
        where: { id: notification.id, userId: user.id, emailSentAt: null },
        data: { emailSentAt: now },
      });
      count += 1;
    }
  }
  return { users: users.length, notifications: count, skipped: false };
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}
