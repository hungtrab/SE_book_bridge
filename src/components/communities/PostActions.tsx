"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export type ReactionName = "LIKE" | "LOVE" | "CARE" | "HAHA" | "WOW" | "SAD" | "ANGRY";
export const REACTIONS: Array<{ type: ReactionName; emoji: string; label: string }> = [
  { type: "LIKE", emoji: "👍", label: "Like" }, { type: "LOVE", emoji: "❤️", label: "Love" }, { type: "CARE", emoji: "🥰", label: "Care" },
  { type: "HAHA", emoji: "😆", label: "Haha" }, { type: "WOW", emoji: "😮", label: "Wow" }, { type: "SAD", emoji: "😢", label: "Sad" }, { type: "ANGRY", emoji: "😡", label: "Angry" },
];

export function PostActions({ communityId, postId, isPinned, reactions: initial, currentUserId, canPin, canDelete, canReact, onComment }: {
  communityId: string; postId: string; isPinned: boolean; reactions: Array<{ userId: string; reaction: ReactionName }>;
  currentUserId?: string; canPin: boolean; canDelete: boolean; canReact: boolean; onComment?: () => void;
}) {
  const router = useRouter();
  const [reactions, setReactions] = useState(initial);
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = reactions.find((row) => row.userId === currentUserId)?.reaction ?? null;
  const selectedMeta = REACTIONS.find((item) => item.type === selected);

  async function react(reaction: ReactionName) {
    if (!currentUserId) return;
    const before = reactions;
    const existing = before.find((row) => row.userId === currentUserId);
    setReactions(existing?.reaction === reaction ? before.filter((row) => row.userId !== currentUserId) : [...before.filter((row) => row.userId !== currentUserId), { userId: currentUserId, reaction }]);
    setError(null);
    const res = await fetch(`/api/communities/${communityId}/posts/${postId}/likes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reaction }) });
    if (!res.ok) { setReactions(before); const body = await res.json().catch(() => ({})); setError(body.error ?? "Could not save reaction"); }
  }
  async function togglePin() {
    setPending(true); const res = await fetch(`/api/communities/${communityId}/posts/${postId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPinned: !isPinned }) }); setPending(false); if (res.ok) router.refresh();
  }
  async function deletePost() {
    setPending(true); const res = await fetch(`/api/communities/${communityId}/posts/${postId}`, { method: "DELETE" }); setPending(false); if (res.ok) { setDeleteOpen(false); router.refresh(); }
  }
  const kinds = REACTIONS.filter((item) => reactions.some((row) => row.reaction === item.type)).slice(0, 3);
  return <div className="space-y-2">
    <div className="flex items-center justify-between px-1 text-sm text-gray-500"><span>{reactions.length ? `${kinds.map((item) => item.emoji).join("")} ${reactions.length}` : "Be the first to react"}</span><span>{isPinned ? "Pinned post" : ""}</span></div>
    <div className="grid grid-cols-2 border-y py-1">
      <div className="reaction-hover-zone"><div className="reaction-picker">{REACTIONS.map((item) => <button key={item.type} type="button" title={item.label} onClick={() => react(item.type)}>{item.emoji}</button>)}</div>
        <button type="button" disabled={!canReact} onClick={() => react(selected ?? "LIKE")} className={`community-action ${selected ? "text-blue-600" : ""}`}><span>{selectedMeta?.emoji ?? "👍"}</span>{selectedMeta?.label ?? "Like"}</button>
      </div>
      <button type="button" onClick={onComment} className="community-action">💬 Comment</button>
    </div>
    {(canPin || canDelete) && <div className="flex justify-end gap-1">{canPin && <button type="button" disabled={pending} onClick={togglePin} className="btn-ghost btn-xs">{isPinned ? "Unpin" : "Pin"}</button>}{canDelete && <button type="button" disabled={pending} onClick={() => setDeleteOpen(true)} className="btn-danger-soft btn-xs">Delete</button>}</div>}
    {error && <p className="text-xs text-red-600">{error}</p>}
    <ConfirmDialog open={deleteOpen} title="Delete this post?" message="The post, comments, replies, and reactions will be permanently removed." confirmLabel="Delete" dangerous pending={pending} onConfirm={deletePost} onCancel={() => setDeleteOpen(false)} />
  </div>;
}
