"use client";

import { useState } from "react";

export function ReportButton({ targetType, targetId }: { targetType: "USER" | "LISTING" | "TRANSACTION" | "MESSAGE"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, details, evidenceUrl }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setMessage(body.error ?? "Could not send ticket");
      return;
    }
    setMessage("Ticket sent to moderators.");
    setReason("");
    setDetails("");
    setEvidenceUrl("");
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="text-sm text-blue-700 underline">Send ticket to moderator</button>;
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded border border-blue-200 p-3">
      <p className="text-sm font-semibold">Send a support ticket to moderators</p>
      <input required minLength={3} maxLength={120} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Short summary, e.g. suspicious listing" className="w-full rounded border px-2 py-1" />
      <textarea maxLength={2000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Explain what happened. Moderators can review the linked user/listing/transaction/message." className="w-full rounded border px-2 py-1" />
      <input type="url" maxLength={500} value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="Evidence link, e.g. screenshot URL (optional)" className="w-full rounded border px-2 py-1" />
      {message && <p className="text-sm">{message}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="rounded bg-blue-700 px-3 py-1 text-sm text-white disabled:opacity-50">{pending ? "Sending..." : "Send ticket"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1 text-sm">Close</button>
      </div>
    </form>
  );
}
