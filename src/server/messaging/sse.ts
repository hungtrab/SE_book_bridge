import type { User } from "@prisma/client";
import { getMessages } from "./service";

const encoder = new TextEncoder();
export function messageStream(user: User, conversationId: string, signal: AbortSignal) {
  let after = new Date();
  let timer: ReturnType<typeof setInterval> | undefined;
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("retry: 3000\n\n"));
      timer = setInterval(async () => {
        try {
          const out = await getMessages(user, conversationId, after);
          for (const message of out.messages) {
            after = message.createdAt;
            controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`));
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "stream error" })}\n\n`));
        }
      }, 2000);
      signal.addEventListener("abort", () => { if (timer) clearInterval(timer); controller.close(); });
    },
    cancel() { if (timer) clearInterval(timer); },
  });
}
