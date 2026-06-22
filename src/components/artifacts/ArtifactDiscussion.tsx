"use client";

import Link from "next/link";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Comment = {
  id: string;
  authorId: string;
  body: string;
  likeCount: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    reputationTier: string;
  };
  likes?: Array<{ userId: string }>;
};

export function ArtifactDiscussion({
  slug,
  currentUserId,
  canModerate,
}: {
  slug: string;
  currentUserId?: string;
  canModerate?: boolean;
}) {
  const [sort, setSort] = useState<"newest" | "liked">("newest");
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(`/api/artifacts/${slug}/comments?sort=${sort}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setError("Could not load the discussion."));
  }, [slug, sort]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch(`/api/artifacts/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const out = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(out.error ?? "Could not post comment.");
      return;
    }
    setBody("");
    setItems((current) => [out, ...current]);
  }

  async function toggleLike(comment: Comment) {
    if (!currentUserId) return;
    const liked = (comment.likes ?? []).length > 0;
    const res = await fetch(`/api/artifacts/comments/${comment.id}/like`, {
      method: liked ? "DELETE" : "POST",
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setItems((current) => current.map((item) => item.id === comment.id
      ? { ...item, likeCount: out.count, likes: out.active ? [{ userId: currentUserId }] : [] }
      : item));
  }

  async function remove(commentId: string) {
    const res = await fetch(`/api/artifacts/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) setItems((current) => current.filter((item) => item.id !== commentId));
  }

  return (
    <section className="mx-auto mt-6 max-w-4xl community-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <p className="text-sm font-semibold text-blue-600">Reader discussion</p>
          <h2 className="text-2xl font-black">Talk about this artifact</h2>
        </div>
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button type="button" onClick={() => setSort("newest")} className={`artifact-sort ${sort === "newest" ? "is-active" : ""}`}>Newest</button>
          <button type="button" onClick={() => setSort("liked")} className={`artifact-sort ${sort === "liked" ? "is-active" : ""}`}>Most liked</button>
        </div>
      </header>

      <div className="p-5">
        {currentUserId ? (
          <form onSubmit={submit} className="flex gap-3">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              minLength={2}
              maxLength={1200}
              rows={2}
              className="field flex-1 resize-none"
              placeholder="Share an interpretation, choice, or moment from the story..."
            />
            <button disabled={pending} className="btn-primary self-end">
              <MessageCircle size={17} /> {pending ? "Posting..." : "Comment"}
            </button>
          </form>
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <Link href="/login" className="font-bold text-blue-600">Sign in</Link> to join this discussion.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 divide-y divide-slate-100">
          {items.map((comment) => {
            const liked = (comment.likes ?? []).length > 0;
            return (
              <article key={comment.id} className="flex gap-3 py-4">
                <span className="grid size-10 flex-none place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white">
                  {comment.author.avatarUrl
                    ? <img src={comment.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                    : comment.author.displayName.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link href={`/profile/${comment.author.id}`} className="font-bold hover:text-blue-600">{comment.author.displayName}</Link>
                    <span className="text-xs text-slate-400">{comment.author.reputationTier} · {new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleLike(comment)}
                      disabled={!currentUserId}
                      className={`like-pill ${liked ? "is-liked" : ""}`}
                    >
                      <Heart size={15} fill={liked ? "currentColor" : "none"} /> {comment.likeCount}
                    </button>
                    {(comment.authorId === currentUserId || canModerate) && (
                      <button type="button" onClick={() => remove(comment.id)} className="btn-ghost btn-xs text-red-600">
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No comments yet. Begin the interpretation.</p>}
        </div>
      </div>
    </section>
  );
}
