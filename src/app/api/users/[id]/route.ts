import { getPublicProfile } from "@/server/users/service";
import { withErrorHandling } from "@/server/lib/errors";

export const GET = withErrorHandling(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const user = await getPublicProfile(id);
    return Response.json(user);
  },
);
