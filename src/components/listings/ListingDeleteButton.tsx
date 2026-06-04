"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ListingDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Delete this listing?")) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not delete listing");
      return;
    }
    router.push("/listings");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
