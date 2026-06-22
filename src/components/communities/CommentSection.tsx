"use client";

import { useRef, useState } from "react";
import { REACTIONS, type ReactionName } from "./PostActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Comment {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { id: string; displayName: string; avatarUrl?: string | null };
  reactions?: Array<{ userId: string; reaction: ReactionName }>;
  replies?: Comment[];
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

export function CommentSection(props: Props) {
  const { communityId, postId, initialComments, commentCount, canComment, currentUserId, isMod } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function focusComposer(comment?: Comment) {
    setReplyTo(comment ? { id: comment.id, name: comment.author.displayName } : null);
    inputRef.current?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    const res = await fetch(`/api/communities/${communityId}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), parentId: replyTo?.id }),
    });
    setPending(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not post comment");
      return;
    }
    if (replyTo) {
      setComments((rows) => rows.map((row) => row.id === replyTo.id ? { ...row, replies: [...(row.replies ?? []), data] } : row));
    } else {
      setComments((rows) => [...rows, data]);
    }
    setBody("");
    setReplyTo(null);
  }

  async function deleteComment(commentId: string) {
    await fetch(`/api/communities/${communityId}/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
    setComments((rows) => rows.filter((row) => row.id !== commentId).map((row) => ({ ...row, replies: row.replies?.filter((reply) => reply.id !== commentId) })));
    setDeleteId(null);
  }

  async function react(commentId: string, reaction: ReactionName) {
    if (!currentUserId) return;
    const before = comments;
    const update = (comment: Comment): Comment => {
      if (comment.id !== commentId) return { ...comment, replies: comment.replies?.map(update) };
      const existing = (comment.reactions ?? []).find((row) => row.userId === currentUserId);
      const reactions = existing?.reaction === reaction
        ? (comment.reactions ?? []).filter((row) => row.userId !== currentUserId)
        : [...(comment.reactions ?? []).filter((row) => row.userId !== currentUserId), { userId: currentUserId, reaction }];
      return { ...comment, reactions };
    };
    setComments((rows) => rows.map(update));
    const res = await fetch(`/api/communities/${communityId}/posts/${postId}/comments/${commentId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    });
    if (!res.ok) {
      setComments(before);
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save reaction");
    }
  }

  const hiddenCount = Math.max(0, commentCount - comments.reduce((sum, comment) => sum + 1 + (comment.replies?.length ?? 0), 0));
  return (
    <div className="space-y-3 pt-2">
      {hiddenCount > 0 && <p className="text-sm font-semibold text-gray-500">View {hiddenCount} more comments</p>}
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentBubble comment={comment} currentUserId={currentUserId} canDelete={comment.author.id === currentUserId || isMod} canReact={canComment} onReply={() => focusComposer(comment)} onDelete={setDeleteId} onReact={react} />
          {(comment.replies ?? []).map((reply) => (
            <div key={reply.id} className="ml-10 border-l-2 border-gray-200 pl-3">
              <CommentBubble comment={reply} currentUserId={currentUserId} canDelete={reply.author.id === currentUserId || isMod} canReact={canComment} onReply={() => focusComposer(comment)} onDelete={setDeleteId} onReact={react} />
            </div>
          ))}
        </div>
      ))}
      {canComment && (
        <form onSubmit={submit} className="space-y-1">
          {replyTo && <p className="ml-11 text-xs text-gray-500">Replying to {replyTo.name} · <button type="button" className="text-blue-600" onClick={() => setReplyTo(null)}>Cancel</button></p>}
          <div className="flex items-center gap-2">
            <span className="community-avatar community-avatar-sm">Y</span>
            <input ref={inputRef} className="flex-1 rounded-full border-0 bg-gray-100 px-4 py-2 text-sm outline-none ring-blue-400 focus:ring-2" placeholder="Write a comment..." value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
            <button disabled={pending || !body.trim()} className="font-semibold text-blue-600 disabled:text-gray-400">{pending ? "..." : "Post"}</button>
          </div>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ConfirmDialog open={Boolean(deleteId)} title="Delete this comment?" message="This comment and any replies beneath it will be permanently removed." confirmLabel="Delete" dangerous onConfirm={() => deleteId && deleteComment(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function CommentBubble({ comment, currentUserId, canDelete, canReact, onReply, onDelete, onReact }: {
  comment: Comment;
  currentUserId?: string;
  canDelete: boolean;
  canReact: boolean;
  onReply: () => void;
  onDelete: (id: string) => void;
  onReact: (id: string, reaction: ReactionName) => void;
}) {
  const mine = (comment.reactions ?? []).find((reaction) => reaction.userId === currentUserId)?.reaction;
  return (
    <div id={`comment-${comment.id}`} className="my-2 flex scroll-mt-24 items-start gap-2">
      <span className="community-avatar community-avatar-sm">{comment.author.displayName.charAt(0).toUpperCase()}</span>
      <div className="min-w-0">
        <div className="relative rounded-2xl bg-gray-100 px-3 py-2">
          <p className="text-sm font-bold">{comment.author.displayName}</p>
          <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
          {(comment.reactions ?? []).length > 0 && <span className="absolute -bottom-3 right-2 rounded-full bg-white px-1.5 py-0.5 text-xs shadow">{(comment.reactions ?? []).slice(0, 3).map((reaction) => REACTIONS.find((item) => item.type === reaction.reaction)?.emoji).join("")} {(comment.reactions ?? []).length}</span>}
        </div>
        <div className="relative mt-1 flex gap-3 px-2 text-xs font-semibold text-gray-500">
          <span className="reaction-hover-zone inline-block">
          <span className="reaction-picker reaction-picker-comment">{REACTIONS.map((reaction) => <button key={reaction.type} type="button" title={reaction.label} onClick={() => onReact(comment.id, reaction.type)}>{reaction.emoji}</button>)}</span>
          <button type="button" disabled={!canReact} onClick={() => onReact(comment.id, mine ?? "LIKE")} className={mine ? "text-blue-600" : ""}>{mine ? REACTIONS.find((item) => item.type === mine)?.label : "Like"}</button>
          </span>
          <button type="button" onClick={onReply}>Reply</button>
          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          {canDelete && <button type="button" onClick={() => onDelete(comment.id)} className="text-red-500">Delete</button>}
        </div>
      </div>
    </div>
  );
}
