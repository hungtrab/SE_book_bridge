import Link from "next/link";

import { UserSummaryList } from "@/components/social/UserSummaryList";
import { getPublicProfile } from "@/server/users/service";
import { listFollowers } from "@/server/social/follow";

export default async function FollowersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, followers] = await Promise.all([
    getPublicProfile(id),
    listFollowers(id),
  ]);
  return (
    <div className="space-y-5">
      <div>
        <Link href={`/profile/${id}`} className="link-soft text-sm">&larr; {profile.displayName}</Link>
        <h1 className="mt-1 text-2xl font-bold">Followers</h1>
      </div>
      <UserSummaryList users={followers} emptyLabel="No followers yet." />
    </div>
  );
}
