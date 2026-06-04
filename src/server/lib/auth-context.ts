// auth-context.ts — read the current user out of an iron-session cookie.
//
// Exposed to all other modules. None of the other modules should touch the
// session cookie directly — go through these helpers.

import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

import type { User, UserRole } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { prisma } from "./prisma";

interface SessionData {
  userId?: string;
  sessionId?: string;
  lastSeenAt?: number;
}

const COOKIE_NAME = "bookbridge_session";
const INACTIVE_TIMEOUT_MS = 30 * 60 * 1000;

function sessionOptions() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 chars long");
  }
  return {
    password,
    cookieName: COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 30,    // absolute cookie cap; app enforces 30-minute inactivity
    },
  };
}

export async function readSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions());
  return session;
}

export async function setSessionUser(userId: string, sessionId?: string): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions());
  session.userId = userId;
  session.sessionId = sessionId;
  session.lastSeenAt = Date.now();
  await session.save();
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions());
  session.destroy();
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await readSession();
  const { userId, lastSeenAt } = session;
  if (!userId) return null;
  if (!lastSeenAt || Date.now() - lastSeenAt > INACTIVE_TIMEOUT_MS) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }
  if (session.sessionId) {
    const dbSession = await prisma.session.findUnique({
      where: { id: session.sessionId },
      select: { revokedAt: true, expiresAt: true },
    });
    if (!dbSession || dbSession.revokedAt || dbSession.expiresAt < new Date()) {
      return null;
    }
  }
  if (session.sessionId) {
    await prisma.session.updateMany({
      where: { id: session.sessionId, revokedAt: null },
      data: { lastSeenAt: new Date() },
    });
  }
  return user;
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new UnauthorizedError();
  if (u.status !== "ACTIVE") throw new UnauthorizedError("Account is not active");
  return u;
}

export async function requireRole(...roles: UserRole[]): Promise<User> {
  const u = await requireUser();
  if (!roles.includes(u.role)) throw new ForbiddenError();
  return u;
}
