"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  communityId: string;
  userId: string;
  currentRole: "MEMBER" | "MODERATOR";
}

export function MemberActions({ communityId, userId, currentRole }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setRole(role: "MEMBER" | "MODERATOR") {
    setPending(true);
    await fetch(`/api/communities/${communityId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setPending(false);
    router.refresh();
  }

  async function removeMember() {
    if (!confirm("Remove this member from the community?")) return;
    setPending(true);
    await fetch(`/api/communities/${communityId}/members/${userId}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      {currentRole === "MEMBER" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRole("MODERATOR")}
          className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          Make mod
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRole("MEMBER")}
          className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Demote
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={removeMember}
        className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
