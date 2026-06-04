import { NextRequest } from "next/server";

import { changePassword, ChangePasswordSchema } from "@/server/auth/service";
import { withErrorHandling } from "@/server/lib/errors";
import { requireUser } from "@/server/lib/auth-context";

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const out = await changePassword(user.id, parsed.data);
  return Response.json(out);
});
