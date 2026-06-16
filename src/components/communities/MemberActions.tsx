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
          className="btn-ghost btn-xs"
        >
          Make mod
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRole("MEMBER")}
          className="btn-secondary btn-xs"
        >
          Demote
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={removeMember}
        className="btn-danger-soft btn-xs"
      >
        Remove
      </button>
    </div>
  );
}
