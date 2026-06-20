"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ImagePlus, X } from "lucide-react";

import { ListingPostAttachment, type PostListing } from "./ListingPostAttachment";

export function CommunityPostForm({
  communityId,
  displayName = "You",
  listings,
}: {
  communityId: string;
  displayName?: string;
  listings: PostListing[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", body: "", listingId: "" });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  function chooseImage(file?: File) {
    setImage(file ?? null);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (image) {
        const upload = new FormData();
        upload.set("image", image);
        const uploadRes = await fetch("/api/communities/posts/images", { method: "POST", body: upload });
        const uploadBody = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadBody.error ?? "Image upload failed");
        imageUrl = uploadBody.url;
      }
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          listingId: form.listingId || undefined,
          imageUrl,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not create post");
      setForm({ title: "", body: "", listingId: "" });
      chooseImage();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create post");
    } finally {
      setPending(false);
    }
  }

  const selectedListing = listings.find((listing) => listing.id === form.listingId);

  function selectListing(listingId: string) {
    const listing = listings.find((item) => item.id === listingId);
    setForm((current) => ({
      ...current,
      listingId,
      title: current.title || (listing ? `${listing.transactionType === "SELL" ? "For sale" : listing.transactionType === "GIFT" ? "Giving away" : "Looking to exchange"}: ${listing.title}` : ""),
    }));
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="community-composer-trigger">
        <span className="community-avatar">{displayName.charAt(0).toUpperCase()}</span>
        <span>Share a book, question, or reading thought...</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="community-card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Create post</h3>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Close</button>
      </div>
      <input required className="field" placeholder="Post title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea required className="min-h-32 w-full resize-y border-0 bg-transparent text-base outline-none" placeholder={`What's on your mind, ${displayName}?`} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <BookOpen size={18} className="text-blue-600" />
          Attach a book listing
        </div>
        {selectedListing ? (
          <div className="space-y-2">
            <ListingPostAttachment listing={selectedListing} compact />
            <button type="button" onClick={() => setForm({ ...form, listingId: "" })} className="btn-ghost btn-sm">
              <X size={16} />
              Remove listing
            </button>
          </div>
        ) : listings.length > 0 ? (
          <select className="field" value={form.listingId} onChange={(e) => selectListing(e.target.value)}>
            <option value="">Choose one of your available books...</option>
            {listings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.title} - {listing.transactionType === "SELL" ? `${listing.askingPriceVnd?.toLocaleString("vi-VN") ?? 0} VND` : listing.transactionType}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              You have no active listings available for this community.
            </p>
            <Link href={`/listings/new?communityId=${communityId}`} className="btn-secondary btn-sm">
              Create listing
            </Link>
          </div>
        )}
      </div>
      {preview && <img src={preview} alt="Post preview" className="max-h-[520px] w-full rounded-2xl object-contain bg-slate-100" />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <label className="btn-secondary btn-sm cursor-pointer">
          <ImagePlus size={16} />
          Add photo
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => chooseImage(e.target.files?.[0])} />
        </label>
        {image && <button type="button" onClick={() => chooseImage()} className="btn-ghost btn-sm">Remove photo</button>}
        <button disabled={pending} className="btn-primary min-w-28">{pending ? "Posting..." : "Post"}</button>
      </div>
      <p className="text-xs text-gray-500">Images are resized to WebP at a maximum of 1024px.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
