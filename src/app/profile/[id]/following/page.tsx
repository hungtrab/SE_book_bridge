import Link from "next/link";

import { UserSummaryList } from "@/components/social/UserSummaryList";
import { getPublicProfile } from "@/server/users/service";
import { listFollowing } from "@/server/social/follow";

export default async function FollowingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, following] = await Promise.all([
    getPublicProfile(id),
    listFollowing(id),
  ]);
  return (
    <div className="space-y-5">
      <div>
        <Link href={`/profile/${id}`} className="link-soft text-sm">&larr; {profile.displayName}</Link>
        <h1 className="mt-1 text-2xl font-bold">Following</h1>
      </div>
      <UserSummaryList users={following} emptyLabel="Not following anyone yet." />
    </div>
  );
}
