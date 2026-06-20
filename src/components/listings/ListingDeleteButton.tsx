"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function ListingDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function remove() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not delete listing");
      return;
    }
    setOpen(false);
    router.push("/listings");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ConfirmDialog open={open} title="Delete this listing?" message="The listing will be removed and will no longer appear in search or community feeds." confirmLabel="Delete" dangerous pending={pending} onConfirm={remove} onCancel={() => setOpen(false)} />
    </div>
  );
}
