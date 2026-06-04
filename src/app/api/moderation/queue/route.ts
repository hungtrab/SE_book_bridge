import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { listModerationQueue } from "@/server/moderation/queue";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const raw = new URL(req.url).searchParams.get("status");
  const status = raw === "RESOLVED" || raw === "REJECTED" ? raw : "PENDING";
  return Response.json({ items: await listModerationQueue(user, status) });
});
