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
  const [showAll, setShowAll] = useState(false);

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

  const hasMore = commentCount > initialComments.length && !showAll;

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {comments.length === 0 && !canComment ? null : (
        <p className="text-xs font-medium text-gray-500">
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </p>
      )}

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2 text-sm">
            <div className="flex-1 rounded bg-gray-50 px-3 py-2">
              <span className="font-medium">{c.author.displayName}</span>
              <span className="ml-2 text-gray-700">{c.body}</span>
              <span className="ml-2 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            {(c.author.id === currentUserId || isMod) && (
              <button
                type="button"
                onClick={() => deleteComment(c.id)}
                className="mt-1 text-xs text-red-400 hover:text-red-600"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-xs text-blue-600 hover:underline"
        >
          Show all {commentCount} comments
        </button>
      )}

      {canComment && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            className="flex-1 rounded border px-2 py-1 text-sm"
            placeholder="Write a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
          <button
            disabled={pending || !body.trim()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {pending ? "…" : "Reply"}
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
