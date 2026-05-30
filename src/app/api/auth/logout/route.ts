import { clearSession } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";

export const POST = withErrorHandling(async () => {
  await clearSession();
  return Response.json({ ok: true });
});
