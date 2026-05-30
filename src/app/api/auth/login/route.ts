import { NextRequest } from "next/server";

import { login, LoginSchema } from "@/server/auth/service";
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
  const user = await login(parsed.data);
  return Response.json(user);
});
