"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Props {
  listingId: string;
  communityId: string;
}

export function ListingDeleteButton({ listingId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteListing() {
    setPending(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to remove listing");
    }
  }

  return (
    <>
    <button
      type="button"
      disabled={pending}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(true); }}
      className="btn-danger btn-xs absolute right-2 top-2 shadow-lg backdrop-blur"
    >
      {pending ? "..." : "Remove"}
    </button>
    <ConfirmDialog open={open} title="Remove this listing?" message="The listing will disappear from this community and pending requests may be cancelled." confirmLabel="Remove" dangerous pending={pending} onConfirm={deleteListing} onCancel={() => setOpen(false)} />
    {error && <p className="text-xs text-red-600">{error}</p>}
    </>
  );
}
