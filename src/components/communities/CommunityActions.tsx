"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommunityActions({ id, joined, isOwner }: { id: string; joined: boolean; isOwner: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "join" | "leave") {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/communities/${id}/${action}`, { method: "POST" });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Community action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {joined ? (
        <button
          type="button"
          disabled={pending || isOwner}
          onClick={() => act("leave")}
          className="rounded border px-3 py-2 disabled:opacity-50"
        >
          {isOwner ? "Owner" : pending ? "Leaving..." : "Leave"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => act("join")}
          className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Joining..." : "Join"}
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
