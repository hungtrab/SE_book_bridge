"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommunityPostForm({ communityId }: { communityId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", body: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch(`/api/communities/${communityId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Could not create post");
      return;
    }
    setForm({ title: "", body: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary btn-sm"
      >
        + New post
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card-surface fade-in-up space-y-3 rounded-2xl p-4">
      <h3 className="font-semibold">New post</h3>
      <input
        required
        className="field"
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        required
        className="field"
        placeholder="Write something..."
        rows={4}
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="btn-primary btn-sm">
          {pending ? "Posting..." : "Post"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
