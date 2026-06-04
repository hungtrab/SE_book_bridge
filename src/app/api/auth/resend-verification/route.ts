import { NextRequest } from "next/server";

import { resendVerification, ResendVerificationSchema } from "@/server/auth/service";
import { withErrorHandling } from "@/server/lib/errors";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = ResendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const out = await resendVerification(parsed.data);
  return Response.json(out);
});
