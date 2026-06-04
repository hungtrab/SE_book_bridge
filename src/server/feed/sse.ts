import { feedAfter } from "./service";

const encoder = new TextEncoder();

export function feedStream(userId: string, signal: AbortSignal) {
  let after = new Date();
  let timer: ReturnType<typeof setInterval> | undefined;
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("retry: 3000\n\n"));
      timer = setInterval(async () => {
        try {
          const items = await feedAfter(userId, after);
          for (const item of items) {
            after = item.createdAt;
            controller.enqueue(encoder.encode(`event: feed-item\ndata: ${JSON.stringify(item)}\n\n`));
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "stream error" })}\n\n`));
        }
      }, 3000);
      signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        controller.close();
      });
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });
}
