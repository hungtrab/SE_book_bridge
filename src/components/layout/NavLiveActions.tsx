"use client";

import { useState } from "react";

import { LiveMessagePanel } from "@/components/messaging/LiveMessagePanel";
import { LiveNotificationBell } from "@/components/notifications/LiveNotificationBell";

type OpenPanel = "messages" | "notifications" | null;

export function NavLiveActions({
  currentUserId,
  initialUnread,
}: {
  currentUserId: string;
  initialUnread: number;
}) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  return (
    <>
      <LiveMessagePanel
        currentUserId={currentUserId}
        open={openPanel === "messages"}
        onOpenChange={(open) => setOpenPanel(open ? "messages" : null)}
      />
      <LiveNotificationBell
        initialUnread={initialUnread}
        open={openPanel === "notifications"}
        onOpenChange={(open) => setOpenPanel(open ? "notifications" : null)}
      />
    </>
  );
}
