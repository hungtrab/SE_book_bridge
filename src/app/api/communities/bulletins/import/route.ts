import { runDailyBulletinImport } from "@/server/bulletins/service";
import { requireRole } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";

/**
 * POST /api/communities/bulletins/import
 * Admin-accessible endpoint to trigger bulletin import from the community page.
 */
export const POST = withErrorHandling(async () => {
  await requireRole("ADMIN");
  const result = await runDailyBulletinImport();
  return Response.json(result);
});
