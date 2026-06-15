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
            className="btn-secondary btn-sm"
          >
            {pending ? "Leaving..." : "Leave"}
          </button>
        ) : (
          !isPrivate && (
            <button
              type="button"
              disabled={pending}
              onClick={() => act("join")}
              className="btn-primary btn-sm"
            >
              {pending ? "Joining..." : "Join"}
            </button>
          )
        )
      )}
      {isOwner && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Owner</span>}
      {isMod && !isOwner && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Moderator</span>}
      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className={confirmDelete ? "btn-danger btn-sm" : "btn-danger-soft btn-sm"}
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
