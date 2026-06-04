import { NextRequest } from "next/server";
import { requireUser } from "@/server/lib/auth-context";
import { getMessages } from "@/server/messaging/service";
import { messageStream } from "@/server/messaging/sse";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  await getMessages(user, id);
  return new Response(messageStream(user, id, req.signal), {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
