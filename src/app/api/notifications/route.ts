import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { listNotifications, longPollNotifications, unreadNotificationCount } from "@/server/notifications/service";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const params = new URL(req.url).searchParams;
  const cursor = params.get("cursor") ?? undefined;
  const after = params.get("after");
  if (params.get("wait") === "1" && after) {
    const afterDate = new Date(after);
    if (!Number.isNaN(afterDate.getTime())) {
      const items = await longPollNotifications(user.id, afterDate);
      return Response.json({ items, nextCursor: null, unreadCount: await unreadNotificationCount(user.id) });
    }
  }
  const out = await listNotifications(user.id, cursor);
  return Response.json({ ...out, unreadCount: await unreadNotificationCount(user.id) });
});
