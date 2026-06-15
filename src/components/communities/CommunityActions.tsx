"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommunityActions({
  id,
  joined,
  isOwner,
  isMod,
  isPrivate,
  canDelete,
}: {
  id: string;
  joined: boolean;
  isOwner: boolean;
  isMod: boolean;
  isPrivate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function act(action: "join" | "leave") {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/communities/${id}/${action}`, { method: "POST" });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setPending(true);
    setError(null);
    const res = await fetch(`/api/communities/${id}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not delete community");
      setConfirmDelete(false);
      return;
    }
    router.push("/communities");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!isOwner && (
        joined ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => act("leave")}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          >
            {pending ? "Leaving..." : "Leave"}
          </button>
        ) : (
          !isPrivate && (
            <button
              type="button"
              disabled={pending}
              onClick={() => act("join")}
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {pending ? "Joining..." : "Join"}
            </button>
          )
        )
      )}
      {isOwner && <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Owner</span>}
      {isMod && !isOwner && <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Moderator</span>}
      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {confirmDelete ? "Confirm delete?" : "Delete community"}
        </button>
      )}
      {confirmDelete && (
        <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 underline">
          Cancel
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
