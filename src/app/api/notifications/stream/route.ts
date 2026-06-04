import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { notificationStream } from "@/server/notifications/sse";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const user = await requireUser();
  return new Response(notificationStream(user.id, req.signal), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
