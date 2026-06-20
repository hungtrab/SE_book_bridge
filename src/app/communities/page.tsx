import Link from "next/link";

import { BulletinFeed } from "@/components/communities/BulletinFeed";
import { CommunityCreateForm } from "@/components/communities/CommunityCreateForm";
import { JoinByCodeForm } from "@/components/communities/JoinByCodeForm";
import { listBulletins } from "@/server/bulletins/service";
import { listCommunities } from "@/server/communities/service";
import { getCurrentUser } from "@/server/lib/auth-context";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage({ searchParams }: {
  searchParams?: Promise<{ q?: string; scope?: "UNIVERSITY" | "LOCATION" | "GENRE" }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const [communities, bulletins] = await Promise.all([
    listCommunities({ q: params?.q, scope: params?.scope }, user?.id),
    listBulletins({ importIfEmpty: true }),
  ]);

  return <div className="space-y-8">
    <header className="community-cover overflow-hidden">
      <div className="community-cover-art flex items-end p-6 text-white">
        <div><p className="text-sm font-bold uppercase tracking-widest text-blue-100">BookBridge Community</p><h1 className="text-4xl font-black tracking-tight">Discover, discuss, and share books</h1><p className="mt-2 max-w-2xl text-blue-50">The main community carries trusted book bulletins. Named subcommunities are spaces where members publish their own posts and listings.</p></div>
      </div>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <main id="bulletins" className="min-w-0 space-y-4">
        <div><p className="text-sm font-semibold text-blue-600">Main feed</p><h2 className="text-2xl font-black">Book bulletins</h2></div>
        <BulletinFeed items={bulletins as never} currentUserId={user?.id} isAdmin={user?.role === "ADMIN"} />
      </main>
      <aside className="space-y-4">
        <div className="community-card p-4"><h2 className="text-lg font-black">How it works</h2><p className="mt-2 text-sm text-gray-600">Bulletins are imported only into the BookBridge main feed. Posts inside subcommunities always come from their members.</p></div>
        {user && <><CommunityCreateForm /><JoinByCodeForm /></>}
      </aside>
    </div>

    <section id="subcommunities" className="space-y-4 border-t pt-8">
      <div><p className="text-sm font-semibold text-violet-600">Member spaces</p><h2 className="text-2xl font-black">Subcommunities</h2><p className="text-sm text-gray-500">Join a named group to publish posts, discuss books, and share listings.</p></div>
      <form className="card-surface flex gap-2 rounded-2xl p-3">
        <input name="q" defaultValue={params?.q ?? ""} placeholder="Search subcommunities" className="flex-1 rounded border px-2 py-1" />
        <select name="scope" defaultValue={params?.scope ?? ""} className="rounded border px-2 py-1"><option value="">Any scope</option><option value="UNIVERSITY">University</option><option value="LOCATION">Location</option><option value="GENRE">Genre</option></select>
        <button className="btn-primary px-3 py-1">Search</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {communities.map((community) => <Link key={community.id} href={`/communities/${community.id}`} className="card-surface interactive-card block rounded-2xl p-4">
          <div className="flex items-start justify-between"><div><h3 className="text-lg font-bold">{community.name}</h3><p className="text-sm">{community.scope} · {community.memberCount} members{community.isPrivate ? " · Private" : ""}</p><p className="text-sm text-gray-500">{community.description ?? "No description"}</p></div>{community.isPrivate && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Private</span>}</div>
        </Link>)}
        {communities.length === 0 && <div className="community-card p-8 text-center text-gray-500 md:col-span-2">No subcommunities match your search.</div>}
      </div>
    </section>
  </div>;
}
