// auth-context.ts — read the current user out of an iron-session cookie.
//
// Exposed to all other modules. None of the other modules should touch the
// session cookie directly — go through these helpers.

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

import type { User, UserRole } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { prisma } from "./prisma";

interface SessionData {
  userId?: string;
}

const COOKIE_NAME = "bookbridge_session";

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
      maxAge: 60 * 60 * 24 * 30,    // 30 days
    },
  };
}

export async function readSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions());
  return session;
}

export async function setSessionUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions());
  session.userId = userId;
  await session.save();
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions());
  session.destroy();
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await readSession();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
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
