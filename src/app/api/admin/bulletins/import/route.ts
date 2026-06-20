import { runDailyBulletinImport } from "@/server/bulletins/service";
import { requireRole } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";

export const POST = withErrorHandling(async () => {
  await requireRole("ADMIN");
  return Response.json(await runDailyBulletinImport());
});
