import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { listNotifications, unreadNotificationCount } from "@/server/notifications/service";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const params = new URL(req.url).searchParams;
  const cursor = params.get("cursor") ?? undefined;
  const out = await listNotifications(user.id, cursor);
  return Response.json({ ...out, unreadCount: await unreadNotificationCount(user.id) });
});
