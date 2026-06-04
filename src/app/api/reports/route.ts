import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { fileReport, ReportSchema } from "@/server/moderation/service";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const parsed = ReportSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await fileReport(user, parsed.data), { status: 201 });
});
