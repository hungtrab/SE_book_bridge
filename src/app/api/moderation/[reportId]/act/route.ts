import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { applyModerationAction, ModerationActionSchema } from "@/server/moderation/service";

export const POST = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ reportId: string }> }) => {
  const user = await requireUser();
  const { reportId } = await ctx.params;
  const parsed = ModerationActionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await applyModerationAction(user, reportId, parsed.data));
});
