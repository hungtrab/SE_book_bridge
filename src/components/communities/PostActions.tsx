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
  const [popping, setPopping] = useState(false);

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
    if (nextLiked) {
      setPopping(true);
      setTimeout(() => setPopping(false), 280);
    }
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
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 active:scale-90 ${
            optimisticLiked
              ? "bg-pink-50 text-pink-600 hover:bg-pink-100"
              : "text-gray-500 hover:bg-gray-100 hover:text-pink-600"
          }`}
        >
          <span className={`text-sm leading-none ${popping ? "like-pop" : ""}`}>
            {optimisticLiked ? "♥" : "♡"}
          </span>
          {optimisticLikes}
        </button>
      )}
      {!canLike && likeCount > 0 && (
        <span className="flex items-center gap-1 px-2 text-xs text-gray-400">♥ {likeCount}</span>
      )}
      {canPin && (
        <button
          type="button"
          disabled={pending}
          onClick={togglePin}
          className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 transition-all duration-150 hover:bg-blue-50 active:scale-90 disabled:opacity-50"
        >
          {isPinned ? "Unpin" : "Pin"}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={deletePost}
          className="rounded-full px-3 py-1 text-xs font-semibold text-red-500 transition-all duration-150 hover:bg-red-50 active:scale-90 disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
