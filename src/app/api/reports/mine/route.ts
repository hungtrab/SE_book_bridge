import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { listMyReports } from "@/server/moderation/service";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return Response.json({ items: await listMyReports(user.id) });
});
