"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ModerationActionForm({ reportId, targetType, transactionStatus }: { reportId: string; targetType: string; transactionStatus?: string }) {
  const router = useRouter();
  const canResolveDispute = targetType === "TRANSACTION" && transactionStatus === "DISPUTED";
  const defaultAction = targetType === "LISTING"
    ? "REMOVE_LISTING"
    : canResolveDispute
      ? "RESOLVE_DISPUTE"
      : "WARN";
  const [action, setAction] = useState(defaultAction);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch(`/api/moderation/${reportId}/act`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(body.error ?? "Could not apply action");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
      <select value={action} onChange={(event) => setAction(event.target.value)} className="rounded border px-2 py-1">
        <option value="WARN">Warn user</option>
        <option value="REMOVE_LISTING">Remove listing</option>
        <option value="SUSPEND_USER">Suspend user</option>
        <option value="RESTORE">Restore target</option>
        {canResolveDispute && (
          <>
            <option value="RESOLVE_DISPUTE">Resolve dispute</option>
            <option value="REJECT_DISPUTE">Reject dispute</option>
          </>
        )}
        <option value="REJECT_REPORT">Close ticket without action</option>
      </select>
      <input required minLength={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Audit notes" className="min-w-64 flex-1 rounded border px-2 py-1" />
      <button disabled={pending} className="rounded bg-red-700 px-3 py-1 text-white disabled:opacity-50">{pending ? "Applying..." : "Apply"}</button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
