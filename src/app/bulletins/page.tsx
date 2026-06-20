import { CommentSection } from "@/components/communities/CommentSection";
import { PostActions, type ReactionName } from "@/components/communities/PostActions";
import { listBulletins } from "@/server/bulletins/service";
import { getCurrentUser } from "@/server/lib/auth-context";

export const dynamic = "force-dynamic";

export default async function BulletinsPage() {
  const [items, user] = await Promise.all([listBulletins(), getCurrentUser()]);
  return <div className="mx-auto max-w-3xl space-y-5">
    <header className="community-card p-6"><p className="text-sm font-bold text-blue-600">Daily discovery</p><h1 className="text-3xl font-black">Book Bulletins</h1><p className="mt-2 text-gray-600">Source-attributed book news and trending reads. Open the original source, then discuss it here.</p></header>
    {items.length === 0 ? <div className="community-card p-8 text-center text-gray-500">No bulletins imported yet.</div> : items.map((post) => <article key={post.id} className="community-card overflow-visible">
      <header className="flex gap-3 p-4 pb-2"><span className="community-avatar">B</span><div><p className="font-bold">{post.sourceName ?? post.author.displayName}</p><p className="text-xs text-gray-500">{new Date(post.publishedAt ?? post.createdAt).toLocaleString()} · Book bulletin</p></div></header>
      <div className="space-y-2 px-4 pb-3"><h2 className="text-xl font-black">{post.title}</h2><p className="whitespace-pre-wrap leading-7 text-gray-800">{post.body}</p>{post.sourceUrl && <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-xl border bg-gray-50 p-3 font-semibold text-blue-600 hover:bg-gray-100">Read at {post.sourceName ?? "original source"} ↗</a>}</div>
      {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="max-h-[640px] w-full bg-slate-100 object-contain" />}
      <div className="px-4 pb-4 pt-2">
        <PostActions communityId={post.communityId} postId={post.id} isPinned={false} reactions={post.likes as Array<{ userId: string; reaction: ReactionName }>} currentUserId={user?.id} canPin={false} canDelete={user?.role === "ADMIN"} canReact={Boolean(user)} />
        <CommentSection communityId={post.communityId} postId={post.id} initialComments={post.comments as never} commentCount={post.commentCount} canComment={Boolean(user)} currentUserId={user?.id} isMod={user?.role === "ADMIN"} />
      </div>
    </article>)}
  </div>;
}
