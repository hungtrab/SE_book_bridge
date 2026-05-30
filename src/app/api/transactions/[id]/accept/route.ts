import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { applyAction } from "@/server/transactions/service";

export const POST = withErrorHandling(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const out = await applyAction(user, id, { kind: "accept", actor: "owner" });
    return Response.json(out);
  },
);
