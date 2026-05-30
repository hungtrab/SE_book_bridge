import { z } from "zod";

import { prisma } from "@/server/lib/prisma";
import { requireUser } from "@/server/lib/auth-context";
import {
  ConflictError,
  withErrorHandling,
} from "@/server/lib/errors";

const CreateSchema = z.object({
  name: z.string().min(2).max(64),
  scope: z.enum(["UNIVERSITY", "LOCATION", "GENRE"]),
  description: z.string().max(500).optional(),
});

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const scope = url.searchParams.get("scope") as
    | "UNIVERSITY" | "LOCATION" | "GENRE" | null;
  const items = await prisma.community.findMany({
    where: {
      AND: [
        scope ? { scope } : {},
        q ? { name: { contains: q, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { memberCount: "desc" },
    take: 50,
  });
  return Response.json({ items });
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const data = CreateSchema.parse(body);

  const existing = await prisma.communityMembership.count({
    where: { userId: user.id },
  });
  if (existing >= 20) throw new ConflictError("You can join at most 20 communities");

  const created = await prisma.$transaction(async (tx) => {
    const c = await tx.community.create({
      data: {
        ownerId: user.id,
        name: data.name,
        scope: data.scope,
        description: data.description,
        memberCount: 1,
      },
    });
    await tx.communityMembership.create({
      data: { userId: user.id, communityId: c.id, role: "MODERATOR" },
    });
    return c;
  });

  return Response.json(created, { status: 201 });
});
