"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ReactionName = "LIKE" | "LOVE" | "CARE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

export const REACTIONS: Array<{ type: ReactionName; emoji: string; label: string }> = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "CARE", emoji: "🥰", label: "Care" },
  { type: "HAHA", emoji: "😆", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Sad" },
  { type: "ANGRY", emoji: "😡", label: "Angry" },
];

interface Props {
  communityId: string;
  postId: string;
  isPinned: boolean;
  reactions: Array<{ userId: string; reaction: ReactionName }>;
  currentUserId?: string;
  canPin: boolean;
  canDelete: boolean;
  canReact: boolean;
  onComment?: () => void;
}

export function PostActions({ communityId, postId, isPinned, reactions, currentUserId, canPin, canDelete, canReact, onComment }: Props) {
  const router = useRouter();
  const mine = reactions.find((reaction) => reaction.userId === currentUserId)?.reaction ?? null;
  const [selected, setSelected] = useState<ReactionName | null>(mine);
  const [count, setCount] = useState(reactions.length);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function react(reaction: ReactionName) {
    const previous = selected;
    const next = previous === reaction ? null : reaction;
    setSelected(next);
    setCount((value) => Math.max(0, value + (!previous && next ? 1 : previous && !next ? -1 : 0)));
    setPickerOpen(false);
    const res = await fetch(`/api/communities/${communityId}/posts/${postId}/likes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    });
    if (!res.ok) {
      setSelected(previous);
      setCount(reactions.length);
    }
  }

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

  const selectedMeta = REACTIONS.find((item) => item.type === selected);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 text-sm text-gray-500">
        <span>{count > 0 ? `${REACTIONS.filter((item) => reactions.some((reaction) => reaction.reaction === item.type)).slice(0, 3).map((item) => item.emoji).join("")} ${count}` : "Be the first to react"}</span>
        <span>{isPinned ? "Pinned post" : ""}</span>
      </div>
      <div className="grid grid-cols-2 border-y py-1">
        <div className="relative">
          {pickerOpen && (
            <div className="reaction-picker">
              {REACTIONS.map((reaction) => (
                <button key={reaction.type} type="button" title={reaction.label} onClick={() => react(reaction.type)}>{reaction.emoji}</button>
              ))}
            </div>
          )}
          <button type="button" disabled={!canReact} onClick={() => selected ? react(selected) : react("LIKE")} onMouseEnter={() => canReact && setPickerOpen(true)} onFocus={() => canReact && setPickerOpen(true)} className={`community-action ${selected ? "text-blue-600" : ""}`}>
            <span>{selectedMeta?.emoji ?? "👍"}</span>{selectedMeta?.label ?? "Like"}
          </button>
        </div>
        <button type="button" onClick={onComment} className="community-action">💬 Comment</button>
      </div>
      {(canPin || canDelete) && (
        <div className="flex justify-end gap-1">
          {canPin && <button type="button" disabled={pending} onClick={togglePin} className="btn-ghost btn-xs">{isPinned ? "Unpin" : "Pin"}</button>}
          {canDelete && <button type="button" disabled={pending} onClick={deletePost} className="btn-danger-soft btn-xs">Delete</button>}
        </div>
      )}
    </div>
  );
}
