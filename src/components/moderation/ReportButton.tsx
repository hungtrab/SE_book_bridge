"use client";

import { useState } from "react";

export function ReportButton({ targetType, targetId }: { targetType: "USER" | "LISTING" | "TRANSACTION" | "MESSAGE"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, details }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setMessage(body.error ?? "Could not file report");
      return;
    }
    setMessage("Report submitted for moderator review.");
    setReason("");
    setDetails("");
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="text-sm text-red-700 underline">Report</button>;
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded border border-red-200 p-3">
      <input required minLength={3} maxLength={120} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="w-full rounded border px-2 py-1" />
      <textarea maxLength={2000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Details for moderators" className="w-full rounded border px-2 py-1" />
      {message && <p className="text-sm">{message}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="rounded bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50">{pending ? "Submitting..." : "Submit report"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1 text-sm">Close</button>
      </div>
    </form>
  );
}
