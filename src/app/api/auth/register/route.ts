import { NextRequest } from "next/server";

import { register, RegisterSchema } from "@/server/auth/service";
import { withErrorHandling } from "@/server/lib/errors";


export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const out = await register(parsed.data);
  return Response.json(out, { status: 201 });
});
