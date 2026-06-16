"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  listingId: string;
  communityId: string;
}

export function ListingDeleteButton({ listingId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function deleteListing(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Remove this listing?")) return;
    setPending(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to remove listing");
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={deleteListing}
      className="btn-danger btn-xs absolute right-2 top-2 shadow-lg backdrop-blur"
    >
      {pending ? "..." : "Remove"}
    </button>
  );
}
