"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransactionActions({ id, status, isOwner, isRequester }: { id: string; status: string; isOwner: boolean; isRequester: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"IN_PERSON" | "POSTAL">("IN_PERSON");
  const [trackingNumber, setTrackingNumber] = useState("");

  async function act(action: string, body: Record<string, unknown> = {}) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/transactions/${id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) { setError(out.error ?? "Action failed"); return false; }
    router.refresh();
    return true;
  }

  function cancel() { const reason = window.prompt("Cancellation reason (optional)") ?? undefined; void act("cancel", { reason }); }
  function dispute() { const reason = window.prompt("Describe the dispute") ?? undefined; void act("dispute", { reason }); }
  function rate() { const stars = Number(window.prompt("Rating from 1 to 5")); const comment = window.prompt("Comment (optional)") ?? undefined; void act("rate", { stars, comment }); }

  async function confirmShip() {
    if (deliveryMethod === "POSTAL" && !trackingNumber.trim()) {
      setError("Postal delivery requires a tracking number");
      return;
    }
    const ok = await act("ship", {
      deliveryMethod,
      trackingNumber: deliveryMethod === "POSTAL" ? trackingNumber.trim() : undefined,
    });
    if (ok) { setShipOpen(false); setTrackingNumber(""); }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {isOwner && status === "PENDING" && <><Button disabled={pending} onClick={() => act("accept")}>Accept</Button><Button disabled={pending} onClick={() => act("decline")}>Decline</Button></>}
        {(isOwner || isRequester) && (status === "PENDING" || status === "ACCEPTED") && <Button disabled={pending} onClick={cancel}>Cancel</Button>}
        {isOwner && status === "ACCEPTED" && <Button disabled={pending} onClick={() => { setError(null); setShipOpen((v) => !v); }}>Mark delivered/shipped</Button>}
        {isRequester && status === "IN_DELIVERY" && <Button disabled={pending} onClick={() => act("complete")}>Confirm received</Button>}
        {(isOwner || isRequester) && (status === "IN_DELIVERY" || status === "COMPLETED") && <Button disabled={pending} onClick={dispute}>Dispute</Button>}
        {(isOwner || isRequester) && status === "COMPLETED" && <Button disabled={pending} onClick={rate}>Rate</Button>}
      </div>

      {shipOpen && isOwner && status === "ACCEPTED" && (
        <div className="card-surface space-y-3 rounded-xl p-3">
          <p className="text-sm font-semibold">How is this book being delivered?</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDeliveryMethod("IN_PERSON")}
              className={`btn-sm ${deliveryMethod === "IN_PERSON" ? "btn-primary" : "btn-secondary"}`}
            >
              In person
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("POSTAL")}
              className={`btn-sm ${deliveryMethod === "POSTAL" ? "btn-primary" : "btn-secondary"}`}
            >
              Postal
            </button>
          </div>
          {deliveryMethod === "POSTAL" && (
            <label className="block">
              <span className="text-sm">Tracking number</span>
              <input
                className="field mt-1"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. VN123456789"
                maxLength={120}
              />
            </label>
          )}
          {deliveryMethod === "IN_PERSON" && (
            <p className="text-xs text-gray-500">No tracking number needed for in-person handoff.</p>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={confirmShip} className="btn-primary btn-sm">
              {pending ? "..." : "Confirm"}
            </button>
            <button type="button" disabled={pending} onClick={() => { setShipOpen(false); setError(null); }} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50" {...props}>{children}</button>;
}
