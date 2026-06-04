// auth/service.ts — register, login, verify email, reset password.

import argon2 from "argon2";
import crypto from "node:crypto";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../lib/errors";
import { setSessionUser } from "../lib/auth-context";
import { sendAuthEmail } from "./email";
import { clearLoginAttempts } from "./rate-limit";

const EMAIL_VERIFY_TTL_HOURS = 72;
const PASSWORD_RESET_TTL_HOURS = 1;
const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const PasswordSchema = z.string()
  .min(8)
  .regex(/[A-Z]/, "must include an uppercase letter")
  .regex(/[a-z]/, "must include a lowercase letter")
  .regex(/[0-9]/, "must include a digit");


// ----- Validation schemas (re-exported for use by API routes) ------------------

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: PasswordSchema,
  displayName: z.string().min(2).max(64),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(32),
});

export const PasswordResetStartSchema = z.object({
  email: z.string().email(),
});

export const PasswordResetCompleteSchema = z.object({
  token: z.string().min(32),
  password: PasswordSchema,
});

export const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
});


// ----- Public API --------------------------------------------------------------

export async function register(input: z.infer<typeof RegisterSchema>) {
  const data = RegisterSchema.parse(input);
  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
  const token = makeToken();
  const tokenHash = hashToken(token);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        displayName: data.displayName,
        passwordHash,
      },
    });
    await tx.emailVerificationToken.create({
      data: {
        userId: created.id,
        tokenHash,
        expiresAt: hoursFromNow(EMAIL_VERIFY_TTL_HOURS),
      },
    });
    return created;
  });
  await sendAuthEmail({ kind: "verify-email", email: user.email, token });

  return withDevToken({
    id: user.id,
    email: user.email,
    status: user.status,
    message: "Account created. Please verify your email before signing in.",
  }, token);
}

export async function login(input: z.infer<typeof LoginSchema>, meta?: { ipAddress?: string; userAgent?: string }) {
  const data = LoginSchema.parse(input);
  const email = data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-time-ish: always run argon2 verify with a fixed dummy hash to
  // make timing of "user not found" indistinguishable from "wrong password".
  const ok = await argon2.verify(user?.passwordHash ?? DUMMY_ARGON2_HASH, data.password)
                 .catch(() => false);
  if (!user || !ok) throw new UnauthorizedError("Invalid email or password");

  if (user.status === "SUSPENDED")
    throw new UnauthorizedError("Account suspended");
  if (user.status === "DELETED")
    throw new UnauthorizedError("Account deleted");
  if (user.status === "PENDING_VERIFICATION")
    throw new UnauthorizedError("Please verify your email first");

  const dbSession = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });
  await setSessionUser(user.id, dbSession.id);
  clearLoginAttempts(email);
  return { id: user.id, email: user.email, displayName: user.displayName };
}

export async function verifyEmail(input: z.infer<typeof VerifyEmailSchema>) {
  const data = VerifyEmailSchema.parse(input);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(data.token) },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new BadRequestError("Verification token is invalid or expired");
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    return tx.user.update({
      where: { id: row.userId },
      data: {
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
  });

  return { id: user.id, email: user.email, status: user.status };
}

export async function resendVerification(input: z.infer<typeof ResendVerificationSchema>) {
  const data = ResendVerificationSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user || user.status === "DELETED" || user.status === "ACTIVE") {
    return { message: "If verification is required, a new email has been sent." };
  }

  const token = makeToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: hoursFromNow(EMAIL_VERIFY_TTL_HOURS),
    },
  });
  await sendAuthEmail({ kind: "verify-email", email: user.email, token });

  return withDevToken({ message: "If verification is required, a new email has been sent." }, token);
}

export async function startPasswordReset(input: z.infer<typeof PasswordResetStartSchema>) {
  const data = PasswordResetStartSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user || user.status === "DELETED") {
    // Do not leak account existence.
    return { message: "If that email exists, a reset link has been sent." };
  }

  const token = makeToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: hoursFromNow(PASSWORD_RESET_TTL_HOURS),
    },
  });
  await sendAuthEmail({ kind: "reset-password", email: user.email, token });

  return withDevToken({ message: "If that email exists, a reset link has been sent." }, token);
}

export async function completePasswordReset(input: z.infer<typeof PasswordResetCompleteSchema>) {
  const data = PasswordResetCompleteSchema.parse(input);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(data.token) },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new BadRequestError("Reset token is invalid or expired");
  }
  if (row.user.status === "SUSPENDED" || row.user.status === "DELETED") {
    throw new UnauthorizedError("Account is not active");
  }

  const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
  });

  return { message: "Password has been reset." };
}

export async function changePassword(userId: string, input: z.infer<typeof ChangePasswordSchema>) {
  const data = ChangePasswordSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError();
  const ok = await argon2.verify(user.passwordHash, data.currentPassword);
  if (!ok) throw new UnauthorizedError("Current password is wrong");
  if (data.currentPassword === data.newPassword) {
    throw new BadRequestError("New password must be different");
  }
  const newHash = await argon2.hash(data.newPassword, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  return { message: "Password changed." };
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  });
}

export async function revokeSession(userId: string, sessionId: string) {
  const result = await prisma.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError("Session not found");
  return { ok: true };
}

function makeToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function withDevToken<T extends object>(payload: T, token: string): T & { devToken?: string } {
  if (process.env.NODE_ENV === "production") return payload;
  return { ...payload, devToken: token };
}
