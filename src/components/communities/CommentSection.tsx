"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Comment {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { id: string; displayName: string; avatarUrl?: string | null };
}

interface Props {
  communityId: string;
  postId: string;
  initialComments: Comment[];
  commentCount: number;
  canComment: boolean;
  currentUserId?: string;
  isMod: boolean;
}

export function CommentSection({ communityId, postId, initialComments, commentCount, canComment, currentUserId, isMod }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/communities/${communityId}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not post comment");
      return;
    }
    const newComment = await res.json();
    setComments((prev) => [...prev, newComment]);
    setBody("");
    router.refresh();
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    await fetch(`/api/communities/${communityId}/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    router.refresh();
  }

  const hiddenCount = Math.max(0, commentCount - comments.length);

  return (
    <div className="space-y-2 px-4 pb-3 pt-2">
      {hiddenCount > 0 && (
        <p className="text-xs text-gray-400">+ {hiddenCount} more comments</p>
      )}

      <div className="space-y-2">
        {comments.map((c) => {
          const canDelete = c.author.id === currentUserId || isMod;
          const initial = (c.author.displayName?.[0] ?? "?").toUpperCase();
          return (
            <div key={c.id} className="fade-in-up flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1">
                  <div className="flex-1 rounded-2xl bg-gray-100 px-3 py-1.5 text-sm">
                    <span className="font-bold">{c.author.displayName}</span>{" "}
                    <span className="whitespace-pre-wrap">{c.body}</span>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="ml-1 shrink-0 text-xs text-red-400 hover:text-red-600"
                      aria-label="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="ml-2 mt-0.5 text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {canComment && (
        <form onSubmit={submit} className="flex items-center gap-2 pt-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white">
            {(currentUserId?.[0] ?? "Y").toUpperCase()}
          </div>
          <input
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
            placeholder="Write a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="text-sm font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {pending ? "…" : "Send"}
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
