import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  getNotificationPreference,
  NotificationPreferenceSchema,
  setNotificationPreference,
} from "@/server/notifications/service";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return Response.json(await getNotificationPreference(user.id));
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const parsed = NotificationPreferenceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await setNotificationPreference(user.id, parsed.data));
});
