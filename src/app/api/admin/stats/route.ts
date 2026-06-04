import { requireRole } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { getPlatformStats } from "@/server/admin/stats";

export const GET = withErrorHandling(async () => {
  await requireRole("ADMIN");
  return Response.json(await getPlatformStats());
});
