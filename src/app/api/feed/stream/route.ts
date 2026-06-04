import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { feedStream } from "@/server/feed/sse";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const user = await requireUser();
  return new Response(feedStream(user.id, req.signal), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
