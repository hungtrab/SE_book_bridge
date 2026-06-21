import { NextRequest } from "next/server";

import { getCurrentUser, requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  ArtifactCommentSchema,
  createArtifactComment,
  listArtifactComments,
} from "@/server/artifacts/comments";

export const GET = withErrorHandling(async (
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) => {
  const user = await getCurrentUser();
  const { slug } = await ctx.params;
  const sort = new URL(req.url).searchParams.get("sort") === "liked" ? "liked" : "newest";
  return Response.json({ items: await listArtifactComments(slug, sort, user?.id) });
});

export const POST = withErrorHandling(async (
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) => {
  const user = await requireUser();
  const { slug } = await ctx.params;
  const parsed = ArtifactCommentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Comment must be between 2 and 1200 characters" }, { status: 400 });
  }
  return Response.json(await createArtifactComment(slug, user.id, parsed.data.body), { status: 201 });
});
