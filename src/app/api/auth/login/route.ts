import { NextRequest } from "next/server";

import { login, LoginSchema } from "@/server/auth/service";
import { assertLoginAllowed } from "@/server/auth/rate-limit";
import { withErrorHandling } from "@/server/lib/errors";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  assertLoginAllowed(parsed.data.email.toLowerCase());
  const user = await login(parsed.data, {
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  return Response.json(user);
});
