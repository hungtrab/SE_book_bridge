import { listSessions } from "@/server/auth/service";
import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const sessions = await listSessions(user.id);
  return Response.json({ sessions });
});
