import Link from "next/link";

import { BulletinFeed } from "@/components/communities/BulletinFeed";
import { BulletinImportPanel } from "@/components/communities/BulletinImportPanel";
import { CommunityCreateForm } from "@/components/communities/CommunityCreateForm";
import { JoinByCodeForm } from "@/components/communities/JoinByCodeForm";
import { listBulletins } from "@/server/bulletins/service";
import { listCommunities } from "@/server/communities/service";
import { getCurrentUser } from "@/server/lib/auth-context";

export const dynamic = "force-dynamic";

const SCOPE_ICONS: Record<string, string> = {
  UNIVERSITY: "🎓",
  LOCATION: "📍",
  GENRE: "📚",
};

export default async function CommunitiesPage({ searchParams }: {
  searchParams?: Promise<{ q?: string; scope?: "UNIVERSITY" | "LOCATION" | "GENRE" }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const [communities, bulletins] = await Promise.all([
    listCommunities({ q: params?.q, scope: params?.scope }, user?.id),
    listBulletins({ importIfEmpty: true }),
  ]);
  const bulletinCommunity = bulletins[0]?.community;

  return (
    <div className="space-y-8">
      {/* ── Hero cover ── */}
      <header className="community-cover overflow-hidden">
        <div className="community-cover-art flex items-end p-6 text-white">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-100">BookBridge Community</p>
            <h1 className="text-4xl font-black tracking-tight">Discover, discuss, and share books</h1>
            <p className="mt-2 max-w-2xl text-blue-50">
              The main community carries trusted book bulletins from curated public sources.
              Named subcommunities are spaces where members publish their own posts and listings.
            </p>
          </div>
        </div>
      </header>

      {/* ── Main two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

        {/* ── Bulletin feed (left) ── */}
        <main id="bulletins" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-600">Main feed</p>
              <h2 className="text-2xl font-black">Book bulletins</h2>
            </div>
            <div className="flex items-center gap-2">
              {bulletinCommunity && (
                <Link href={`/communities/${bulletinCommunity.id}`} className="btn-secondary btn-sm">
                  Open BookBridge community
                </Link>
              )}
              {bulletins.length > 0 && (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  {bulletins.length} stories
                </span>
              )}
            </div>
          </div>
          <BulletinFeed items={bulletins as never} currentUserId={user?.id} isAdmin={isAdmin} />
        </main>

        {/* ── Sidebar (right) ── */}
        <aside className="space-y-4">
          {/* How it works */}
          <div className="community-card p-4">
            <h2 className="text-lg font-black">How it works</h2>
            <p className="mt-2 text-sm text-gray-600">
              Bulletins are imported from curated public sources into the main BookBridge feed.
              Posts inside subcommunities always come from their members.
            </p>
          </div>

          {/* Admin-only import panel */}
          {isAdmin && <BulletinImportPanel />}

          {/* Create / join forms */}
          {user && (
            <>
              <CommunityCreateForm />
              <JoinByCodeForm />
            </>
          )}
        </aside>
      </div>

      {/* ── Subcommunities section ── */}
      <section id="subcommunities" className="space-y-6 border-t border-slate-200 pt-10">
        <div>
          <p className="text-sm font-semibold text-violet-600">Member spaces</p>
          <h2 className="text-2xl font-black">Subcommunities</h2>
          <p className="text-sm text-gray-500">
            Join a named group to publish posts, discuss books, and share listings.
          </p>
        </div>

        {/* Search + filter bar */}
        <form className="card-surface flex flex-wrap gap-2 rounded-2xl p-3">
          <input
            name="q"
            defaultValue={params?.q ?? ""}
            placeholder="Search subcommunities…"
            className="field min-w-0 flex-1"
          />
          <select name="scope" defaultValue={params?.scope ?? ""} className="field w-auto">
            <option value="">Any scope</option>
            <option value="UNIVERSITY">🎓 University</option>
            <option value="LOCATION">📍 Location</option>
            <option value="GENRE">📚 Genre</option>
          </select>
          <button className="btn-primary px-4">Search</button>
        </form>

        {/* Grid of community cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {communities.map((community) => {
            const icon = SCOPE_ICONS[community.scope] ?? "🌐";
            const initial = community.name.charAt(0).toUpperCase();
            return (
              <Link
                key={community.id}
                href={`/communities/${community.id}`}
                className="card-surface interactive-card group flex flex-col rounded-2xl p-5"
              >
                {/* Top row: avatar + badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-xl font-black text-white shadow-md">
                    {initial}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-600">
                      {icon} {community.scope.charAt(0) + community.scope.slice(1).toLowerCase()}
                    </span>
                    {community.isPrivate && (
                      <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                        🔒 Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Community name – the key identifier */}
                <h3 className="mt-3 text-lg font-black leading-tight text-gray-900 group-hover:text-blue-700 transition-colors">
                  {community.name}
                </h3>

                <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-500">
                  {community.description ?? "A BookBridge reading community."}
                </p>

                {/* Footer meta */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-gray-400">
                    👥 {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
                  </span>
                  <span className="text-xs font-bold text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                    View →
                  </span>
                </div>
              </Link>
            );
          })}

          {communities.length === 0 && (
            <div className="community-card col-span-full p-10 text-center text-gray-500">
              <p className="text-4xl">🔍</p>
              <p className="mt-2 font-bold">No subcommunities match your search.</p>
              <p className="mt-1 text-sm">Try a different keyword or scope filter.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
