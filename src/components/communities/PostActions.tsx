"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  communityId: string;
  postId: string;
  isPinned: boolean;
  likeCount: number;
  likedByMe: boolean;
  canPin: boolean;
  canDelete: boolean;
  canLike: boolean;
}

export function PostActions({ communityId, postId, isPinned, likeCount, likedByMe, canPin, canDelete, canLike }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState(likeCount);
  const [optimisticLiked, setOptimisticLiked] = useState(likedByMe);

  async function togglePin() {
    setPending(true);
    await fetch(`/api/communities/${communityId}/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !isPinned }),
    });
    setPending(false);
    router.refresh();
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    setPending(true);
    await fetch(`/api/communities/${communityId}/posts/${postId}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  async function toggleLike() {
    const nextLiked = !optimisticLiked;
    setOptimisticLiked(nextLiked);
    setOptimisticLikes((n) => n + (nextLiked ? 1 : -1));
    const res = await fetch(`/api/communities/${communityId}/posts/${postId}/likes`, { method: "POST" });
    if (!res.ok) {
      setOptimisticLiked(optimisticLiked);
      setOptimisticLikes(likeCount);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {canLike && (
        <button
          type="button"
          onClick={toggleLike}
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors ${
            optimisticLiked ? "text-pink-600 hover:text-pink-700" : "text-gray-500 hover:text-pink-600"
          }`}
        >
          {optimisticLiked ? "♥" : "♡"} {optimisticLikes}
        </button>
      )}
      {!canLike && likeCount > 0 && (
        <span className="text-xs text-gray-400">♥ {likeCount}</span>
      )}
      {canPin && (
        <button
          type="button"
          disabled={pending}
          onClick={togglePin}
          className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          {isPinned ? "Unpin" : "Pin"}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={deletePost}
          className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
