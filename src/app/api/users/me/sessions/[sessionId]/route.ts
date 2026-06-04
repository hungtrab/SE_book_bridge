import { revokeSession } from "@/server/auth/service";
import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";

export const DELETE = withErrorHandling(
  async (_req: Request, ctx: { params: Promise<{ sessionId: string }> }) => {
    const user = await requireUser();
    const { sessionId } = await ctx.params;
    const out = await revokeSession(user.id, sessionId);
    return Response.json(out);
  },
);
