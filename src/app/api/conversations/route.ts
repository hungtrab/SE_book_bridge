import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  createDirectConversation,
  DirectConversationSchema,
  listConversations,
} from "@/server/messaging/service";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return Response.json({ items: await listConversations(user.id) });
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const parsed = DirectConversationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Choose a valid user" }, { status: 400 });
  return Response.json(await createDirectConversation(user, parsed.data.userId), { status: 201 });
});
