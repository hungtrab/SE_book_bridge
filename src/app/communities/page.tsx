import Link from "next/link";

import { BulletinFeed } from "@/components/communities/BulletinFeed";
import { BulletinImportPanel } from "@/components/communities/BulletinImportPanel";
import { CommunityCreateForm } from "@/components/communities/CommunityCreateForm";
import { JoinByCodeForm } from "@/components/communities/JoinByCodeForm";
import { listBulletins, type BulletinCommunitySummary } from "@/server/bulletins/service";
import { listCommunities } from "@/server/communities/service";
import { getCurrentUser } from "@/server/lib/auth-context";

export const dynamic = "force-dynamic";

function scopeLabel(scope: string) {
  return scope.charAt(0) + scope.slice(1).toLowerCase();
}

function avatarText(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function CommunitiesPage({ searchParams }: {
  searchParams?: Promise<{ q?: string; scope?: "UNIVERSITY" | "LOCATION" | "GENRE" }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const query = params?.q?.trim() || undefined;
  const scope = params?.scope || undefined;

  const [communities, bulletins] = await Promise.all([
    listCommunities({ q: query, scope }, user?.id),
    listBulletins({ importIfEmpty: true }),
  ]);

  const bulletinCommunity = bulletins[0]?.community as BulletinCommunitySummary | undefined;
  const visibleCommunityCount = Math.min(communities.length, 5);

  return (
    <div className="space-y-5">
      <header className="mx-auto max-w-[840px] space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">BookBridge Community</p>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Discover, discuss, and share books</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          The main community carries source-attributed bulletins. Named subcommunities are the member spaces.
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,840px)_320px] lg:justify-center 2xl:block">
        <main id="bulletins" className="min-w-0 space-y-4 2xl:mx-auto 2xl:w-full 2xl:max-w-[840px]">
          <div className="community-card flex flex-wrap items-start justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-semibold text-blue-600">Main feed</p>
              <h2 className="text-2xl font-black text-gray-900">Book bulletins</h2>
              <p className="mt-1 text-sm text-gray-600">
                Daily imports from Open Library, Library of Congress, Project Gutenberg, Internet Archive,
                NYT Best Sellers, Guardian Books, NPR Book of the Day, and AP Books &amp; Literature.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {bulletinCommunity && (
                <Link href={`/communities/${bulletinCommunity.id}`} className="btn-secondary btn-sm">
                  Open feed community
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

        <aside className="community-sidebar-scroll space-y-4 lg:sticky lg:top-[4.75rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pl-2 2xl:fixed 2xl:bottom-0 2xl:right-0 2xl:top-[4.25rem] 2xl:z-30 2xl:w-[350px] 2xl:max-h-none 2xl:border-l 2xl:border-slate-200/80 2xl:bg-slate-50/90 2xl:p-4 2xl:backdrop-blur-xl">
          {bulletinCommunity && (
            <details className="community-card group overflow-hidden">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-lg font-black text-white shadow-md">
                    {bulletinCommunity.owner.avatarUrl ? (
                      <img
                        src={bulletinCommunity.owner.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarText(bulletinCommunity.name)
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Main community</p>
                    <h2 className="text-lg font-black text-gray-900">{bulletinCommunity.name}</h2>
                    <p className="text-sm text-gray-500">
                      Admin {bulletinCommunity.owner.displayName} / {bulletinCommunity.memberCount} members / Public
                    </p>
                  </div>
                </div>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-slate-100 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  {bulletinCommunity.description ?? "A BookBridge reading community."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    Owner: {bulletinCommunity.owner.displayName}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">Public group</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">Bulletin desk</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/communities/${bulletinCommunity.id}`} className="btn-secondary btn-sm">
                    Open community
                  </Link>
                </div>
              </div>
            </details>
          )}

          {isAdmin && <BulletinImportPanel />}

          <details className="community-card group overflow-hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Member spaces</p>
                <h2 className="text-lg font-black text-gray-900">Subcommunities</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                {visibleCommunityCount} visible / {communities.length}
              </span>
            </summary>
            <div className="border-t border-slate-100 p-4">
              <form className="space-y-3">
                <input
                  name="q"
                  defaultValue={params?.q ?? ""}
                  placeholder="Search subcommunities..."
                  className="field"
                />
                <div className="flex gap-2">
                  <select name="scope" defaultValue={params?.scope ?? ""} className="field min-w-0 flex-1">
                    <option value="">Any scope</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="LOCATION">Location</option>
                    <option value="GENRE">Genre</option>
                  </select>
                  <button className="btn-primary px-4">Search</button>
                </div>
              </form>

              <div className="community-list-scroll mt-4 max-h-[25rem] space-y-3 overflow-y-auto pr-2">
                {communities.map((community) => {
                  const initial = avatarText(community.name);
                  return (
                    <Link
                      key={community.id}
                      href={`/communities/${community.id}`}
                      className="card-surface interactive-card flex items-center gap-3 rounded-2xl p-3"
                    >
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-sm font-black text-white shadow-md">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-black text-gray-900">{community.name}</h3>
                          {community.isPrivate && (
                            <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                              Private
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-gray-500">
                          {scopeLabel(community.scope)} / {community.memberCount} members
                        </p>
                      </div>
                    </Link>
                  );
                })}

                {communities.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-center text-sm text-gray-500">
                    No subcommunities match your search.
                  </div>
                )}
              </div>
            </div>
          </details>

          {user && (
            <details className="community-card group overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Private spaces</p>
                  <h2 className="text-lg font-black">Create or join</h2>
                </div>
                <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-5 border-t border-slate-100 p-4">
                <CommunityCreateForm embedded />
                <div className="h-px bg-slate-200" />
                <JoinByCodeForm embedded />
              </div>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
