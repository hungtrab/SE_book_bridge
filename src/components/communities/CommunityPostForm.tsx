"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommunityPostForm({ communityId, displayName = "You" }: { communityId: string; displayName?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", body: "" });
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
        body: JSON.stringify({ ...form, imageUrl }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not create post");
      setForm({ title: "", body: "" });
      chooseImage();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create post");
    } finally {
      setPending(false);
    }
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
      {preview && <img src={preview} alt="Post preview" className="max-h-[520px] w-full rounded-2xl object-contain bg-slate-100" />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <label className="btn-secondary btn-sm cursor-pointer">
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
