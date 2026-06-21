"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DirectMessageButton({
  userId,
  signedIn,
  compact = false,
}: {
  userId: string;
  signedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function openConversation() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setPending(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(false);
    if (res.ok) router.push(`/messages/${body.id}`);
  }

  return (
    <button
      type="button"
      onClick={openConversation}
      disabled={pending}
      className={compact ? "btn-secondary btn-sm" : "btn-primary"}
    >
      <MessageCircle size={17} />
      {pending ? "Opening..." : "Message seller"}
    </button>
  );
}
