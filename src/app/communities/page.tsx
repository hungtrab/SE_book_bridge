import Link from "next/link";

import { CommunityCreateForm } from "@/components/communities/CommunityCreateForm";
import { getCurrentUser } from "@/server/lib/auth-context";
import { listCommunities } from "@/server/communities/service";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; scope?: "UNIVERSITY" | "LOCATION" | "GENRE" }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const communities = await listCommunities({ q: params?.q, scope: params?.scope }, user?.id);
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Communities</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={params?.q ?? ""} placeholder="Search communities" className="flex-1 rounded border px-2 py-1" />
          <select name="scope" defaultValue={params?.scope ?? ""} className="rounded border px-2 py-1">
            <option value="">Any scope</option>
            <option value="UNIVERSITY">University</option>
            <option value="LOCATION">Location</option>
            <option value="GENRE">Genre</option>
          </select>
          <button className="rounded border px-3 py-1">Search</button>
        </form>
        <div className="space-y-3">
          {communities.map((community) => (
            <Link key={community.id} href={`/communities/${community.id}`} className="block rounded border p-3">
              <h2 className="font-semibold">{community.name}</h2>
              <p className="text-sm">{community.scope} · {community.memberCount} members</p>
              <p className="text-sm text-gray-500">{community.description ?? "No description"}</p>
            </Link>
          ))}
        </div>
      </section>
      {user && <CommunityCreateForm />}
    </div>
  );
}
