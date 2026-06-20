import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/communities/CommentSection";
import { CommunityActions } from "@/components/communities/CommunityActions";
import { CommunitySidebarPanels } from "@/components/communities/CommunitySidebarPanels";
import { CommunityPostForm } from "@/components/communities/CommunityPostForm";
import { InviteCodePanel } from "@/components/communities/InviteCodePanel";
import { ListingPostAttachment } from "@/components/communities/ListingPostAttachment";
import { PostActions, type ReactionName } from "@/components/communities/PostActions";
import { getCurrentUser } from "@/server/lib/auth-context";
import { getCommunity, listShareableListings } from "@/server/communities/service";
import { NotFoundError } from "@/server/lib/errors";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  let community;
  try {
    community = await getCommunity(id, user?.id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const isOwner = Boolean(user && community.ownerId === user.id);
  const isAdmin = user?.role === "ADMIN";
  const isMember = Boolean(community.myMembership);
  const isMod = isOwner || isAdmin || community.myMembership?.role === "MODERATOR";
  const canView = !community.isPrivate || isMember || isAdmin;
  const shareableListings = user && isMember
    ? await listShareableListings(user.id, community.id)
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="community-cover">
        <div className="community-cover-art" />
        <div className="space-y-2 px-5 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">{community.name}</h1>
              <p className="text-sm text-gray-600">{community.scope} · {community.memberCount} members {community.isPrivate ? "· Private group" : "· Public group"}</p>
              <p className="mt-2 max-w-2xl text-gray-700">{community.description ?? "A BookBridge reading community."}</p>
            </div>
            {user && <CommunityActions id={community.id} joined={isMember} isOwner={isOwner} isMod={isMod} isPrivate={community.isPrivate} canDelete={isOwner || isAdmin} />}
          </div>
        </div>
      </section>

      {isMod && community.inviteCode && <InviteCodePanel communityId={community.id} inviteCode={community.inviteCode} />}

      {!canView ? (
        <div className="community-card p-10 text-center">
          <h2 className="text-xl font-bold">This community is private</h2>
          <p className="mt-2 text-gray-500">Use an invite code to join and see posts, discussions, and listings.</p>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0 space-y-4">
            {isMember && (
              <CommunityPostForm
                communityId={community.id}
                displayName={user?.displayName}
                listings={shareableListings}
              />
            )}
            {community.posts.length === 0 ? (
              <div className="community-card p-8 text-center text-gray-500">No posts yet. Start the conversation.</div>
            ) : community.posts.map((post) => (
              <article key={post.id} id={`post-${post.id}`} className="community-card overflow-visible">
                <header className="flex items-start justify-between gap-3 p-4 pb-2">
                  <div className="flex gap-3">
                    <span className="community-avatar">{post.author.displayName.charAt(0).toUpperCase()}</span>
                    <div>
                      <p className="font-bold">{post.author.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.publishedAt ?? post.createdAt).toLocaleString()} · {post.kind === "BULLETIN" ? "Book bulletin" : "Community post"}
                        {post.isPinned ? " · Pinned" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl text-gray-400">•••</span>
                </header>

                <div className="space-y-2 px-4 pb-3">
                  <h2 className="text-lg font-bold">{post.title}</h2>
                  <p className="whitespace-pre-wrap leading-6 text-gray-800">{post.body}</p>
                  {post.sourceUrl && (
                    <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-xl border bg-gray-50 p-3 text-sm hover:bg-gray-100">
                      <span className="font-bold text-blue-600">{post.sourceName ?? "Original source"}</span>
                      <span className="ml-2 text-gray-500">Read the full story ↗</span>
                    </a>
                  )}
                </div>

                {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="max-h-[640px] w-full bg-slate-100 object-contain" />}
                {post.listing && <ListingPostAttachment listing={post.listing} />}

                <div className="px-4 pb-4 pt-2">
                  <PostActions
                    communityId={community.id}
                    postId={post.id}
                    isPinned={post.isPinned}
                    reactions={post.likes as Array<{ userId: string; reaction: ReactionName }>}
                    currentUserId={user?.id}
                    canPin={isMod}
                    canDelete={isMod || user?.id === post.authorId}
                    canReact={isMember}
                  />
                  <CommentSection
                    communityId={community.id}
                    postId={post.id}
                    initialComments={post.comments as never}
                    commentCount={post.commentCount}
                    canComment={isMember}
                    currentUserId={user?.id}
                    isMod={isMod}
                  />
                </div>
              </article>
            ))}
          </main>

          <aside className="lg:sticky lg:top-24"><CommunitySidebarPanels communityId={community.id} ownerId={community.ownerId} currentUserId={user?.id} isMember={isMember} isMod={isMod} listings={community.listings} members={community.memberships} /></aside>
        </div>
      )}
    </div>
  );
}
