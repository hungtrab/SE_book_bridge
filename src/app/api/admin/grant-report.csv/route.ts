import { NextRequest } from "next/server";

import { requireRole } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { buildGrantReport } from "@/server/admin/exports";

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole("ADMIN");
  const params = new URL(req.url).searchParams;
  const csv = await buildGrantReport(params.get("from") ?? undefined, params.get("to") ?? undefined);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=bookbridge-grant-report.csv",
    },
  });
});
