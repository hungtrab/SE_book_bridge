import { CommentSection } from "@/components/communities/CommentSection";
import { PostActions, type ReactionName } from "@/components/communities/PostActions";

type Bulletin = {
  id: string;
  communityId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  commentCount: number;
  author: { displayName: string };
  likes: Array<{ userId: string; reaction: ReactionName }>;
  comments: never;
};

export function BulletinFeed({ items, currentUserId, isAdmin }: {
  items: Bulletin[];
  currentUserId?: string;
  isAdmin: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="community-card p-8 text-center">
        <p className="font-bold text-gray-700">No bulletins are available yet.</p>
        <p className="mt-1 text-sm text-gray-500">BookBridge will retry automatically. An admin can also refresh the feed from the Admin dashboard.</p>
      </div>
    );
  }

  return <div className="space-y-5">{items.map((post) => (
    <article key={post.id} className="community-card overflow-visible">
      <header className="flex gap-3 p-4 pb-2"><span className="community-avatar">B</span><div><p className="font-bold">{post.sourceName ?? post.author.displayName}</p><p className="text-xs text-gray-500">{new Date(post.publishedAt ?? post.createdAt).toLocaleString()} · BookBridge bulletin</p></div></header>
      <div className="space-y-2 px-4 pb-3"><h2 className="text-xl font-black">{post.title}</h2><p className="whitespace-pre-wrap leading-7 text-gray-800">{post.body}</p>{post.sourceUrl && <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-xl border bg-gray-50 p-3 font-semibold text-blue-600 hover:bg-gray-100">Read at {post.sourceName ?? "original source"} ↗</a>}</div>
      {post.imageUrl && <img src={post.imageUrl} alt="" className="max-h-[640px] w-full bg-slate-100 object-contain" />}
      <div className="px-4 pb-4 pt-2">
        <PostActions communityId={post.communityId} postId={post.id} isPinned={false} reactions={post.likes} currentUserId={currentUserId} canPin={false} canDelete={isAdmin} canReact={Boolean(currentUserId)} />
        <CommentSection communityId={post.communityId} postId={post.id} initialComments={post.comments} commentCount={post.commentCount} canComment={Boolean(currentUserId)} currentUserId={currentUserId} isMod={isAdmin} />
      </div>
    </article>
  ))}</div>;
}
