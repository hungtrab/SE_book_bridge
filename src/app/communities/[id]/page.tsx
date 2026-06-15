import Link from "next/link";
import { notFound } from "next/navigation";

import { CommunityActions } from "@/components/communities/CommunityActions";
import { CommunityModeratorForm } from "@/components/communities/CommunityModeratorForm";
import { CommunityPostForm } from "@/components/communities/CommunityPostForm";
import { InviteCodePanel } from "@/components/communities/InviteCodePanel";
import { PostActions } from "@/components/communities/PostActions";
import { MemberActions } from "@/components/communities/MemberActions";
import { CommentSection } from "@/components/communities/CommentSection";
import { getCurrentUser } from "@/server/lib/auth-context";
import { getCommunity } from "@/server/communities/service";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  let community;
  try {
    community = await getCommunity(id, user?.id);
  } catch {
    notFound();
  }

  const isOwner = Boolean(user && community.ownerId === user.id);
  const isAdmin = Boolean(user && user.role === "ADMIN");
  const myRole = community.myMembership?.role ?? null;
  const isMod = isOwner || isAdmin || myRole === "MODERATOR";
  const isMember = Boolean(community.myMembership);
  const canViewContent = !community.isPrivate || isMember || isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{community.name}</h1>
            {community.isPrivate && (
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">Private</span>
            )}
          </div>
          <p className="text-sm text-gray-600">{community.scope} · {community.memberCount} members</p>
          <p className="text-gray-600">{community.description ?? "No description"}</p>
          <p className="text-sm">Owner: {community.owner.displayName}</p>
          {isMember && myRole && (
            <p className="text-xs font-medium text-blue-600">Your role: {myRole}</p>
          )}
        </div>
        {user && (
          <CommunityActions
            id={community.id}
            joined={isMember}
            isOwner={isOwner}
            isMod={isMod}
            isPrivate={community.isPrivate}
            canDelete={isOwner || isAdmin}
          />
        )}
      </div>

      {/* Invite code panel — mod/owner only */}
      {isMod && community.inviteCode && (
        <InviteCodePanel communityId={community.id} inviteCode={community.inviteCode} />
      )}

      {!canViewContent ? (
        <div className="rounded border border-dashed p-8 text-center text-gray-500">
          <p className="font-medium">This is a private community.</p>
          <p className="text-sm">Join with an invite code to see the content.</p>
        </div>
      ) : (
        <>
          {/* Posts */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Posts</h2>
              {isMember && <CommunityPostForm communityId={community.id} />}
            </div>
            {community.posts.length === 0 ? (
              <p className="text-sm text-gray-500">No posts yet.</p>
            ) : (
              <div className="space-y-3">
                {community.posts.map((post) => (
                  <div key={post.id} className="rounded border p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-semibold">
                        {post.isPinned && <span className="mr-1 text-xs font-normal text-blue-600">[Pinned]</span>}
                        {post.title}
                      </h3>
                      <PostActions
                        communityId={community.id}
                        postId={post.id}
                        isPinned={post.isPinned}
                        likeCount={post.likeCount}
                        likedByMe={(post.likes?.length ?? 0) > 0}
                        canPin={isMod}
                        canDelete={isMod || user?.id === post.authorId}
                        canLike={isMember}
                      />
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{post.body}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {post.author.displayName} · {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    <CommentSection
                      communityId={community.id}
                      postId={post.id}
                      initialComments={post.comments}
                      commentCount={post.commentCount}
                      canComment={isMember}
                      currentUserId={user?.id}
                      isMod={isMod}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active listings */}
          <section>
            <h2 className="mb-2 text-xl font-semibold">Active listings</h2>
            {community.listings.length === 0 ? (
              <p className="text-sm text-gray-500">No active listings.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {community.listings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="rounded border p-3">
                    {listing.photos[0] && (
                      <img src={listing.photos[0].url} alt="" className="mb-2 h-32 w-full rounded object-cover" />
                    )}
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm">{listing.author}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Members */}
          <section>
            <h2 className="mb-2 text-xl font-semibold">Members</h2>
            {isMod && <CommunityModeratorForm communityId={community.id} />}
            <div className="mt-3 space-y-1">
              {community.memberships.map((m) => (
                <div key={m.userId} className="flex items-center justify-between rounded border px-3 py-2">
                  <Link href={`/profile/${m.userId}`} className="text-sm font-medium hover:underline">
                    {m.user.displayName}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{m.communityPoints} pts</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      m.userId === community.ownerId
                        ? "bg-yellow-100 text-yellow-700"
                        : m.role === "MODERATOR"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {m.userId === community.ownerId ? "Owner" : m.role}
                    </span>
                    {isMod && m.userId !== community.ownerId && m.userId !== user?.id && (
                      <MemberActions communityId={community.id} userId={m.userId} currentRole={m.role} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
