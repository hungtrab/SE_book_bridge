import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { getTransaction } from "@/server/transactions/service";
export const GET = withErrorHandling(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(); const { id } = await ctx.params; return Response.json(await getTransaction(user, id));
});
