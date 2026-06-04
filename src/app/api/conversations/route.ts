import { requireUser } from "@/server/lib/auth-context"; import { withErrorHandling } from "@/server/lib/errors"; import { listConversations } from "@/server/messaging/service";
export const GET = withErrorHandling(async () => { const user = await requireUser(); return Response.json({ items: await listConversations(user.id) }); });
