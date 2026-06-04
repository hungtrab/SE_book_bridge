import { NextRequest } from "next/server";

import {
  completePasswordReset,
  PasswordResetCompleteSchema,
  PasswordResetStartSchema,
  startPasswordReset,
} from "@/server/auth/service";
import { withErrorHandling } from "@/server/lib/errors";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = PasswordResetStartSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const out = await startPasswordReset(parsed.data);
  return Response.json(out);
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = PasswordResetCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const out = await completePasswordReset(parsed.data);
  return Response.json(out);
});
