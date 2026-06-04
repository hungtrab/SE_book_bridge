import { NextRequest } from "next/server";

import { verifyEmail, VerifyEmailSchema } from "@/server/auth/service";
import { withErrorHandling } from "@/server/lib/errors";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = VerifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const out = await verifyEmail(parsed.data);
  return Response.json(out);
});
