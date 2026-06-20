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

/** Source → color + icon mapping for visual variety */
const SOURCE_THEME: Record<string, { bg: string; text: string; icon: string }> = {
  "Project Gutenberg": { bg: "from-emerald-500 to-teal-600", text: "text-emerald-50", icon: "G" },
  "Internet Archive Texts": { bg: "from-rose-500 to-pink-600", text: "text-rose-50", icon: "IA" },
  "Open Library":                  { bg: "from-sky-500 to-blue-600",    text: "text-sky-50",   icon: "📚" },
  "Library of Congress — Bookmarked": { bg: "from-amber-500 to-orange-600", text: "text-amber-50", icon: "🏛️" },
  "Library of Congress — Bibliomania": { bg: "from-amber-500 to-orange-600", text: "text-amber-50", icon: "📖" },
  "The New York Times Best Sellers": { bg: "from-gray-800 to-gray-900", text: "text-gray-50",  icon: "🗞️" },
  "Guardian Books": { bg: "from-indigo-500 to-violet-600", text: "text-indigo-50", icon: "GB" },
  "NPR Book of the Day": { bg: "from-cyan-500 to-sky-600", text: "text-cyan-50", icon: "NPR" },
  "AP Books & Literature": { bg: "from-amber-600 to-red-600", text: "text-orange-50", icon: "AP" },
};

function sourceTheme(name: string | null) {
  if (!name) return { bg: "from-blue-600 to-violet-600", text: "text-blue-50", icon: "📰" };
  for (const [key, val] of Object.entries(SOURCE_THEME)) {
    if (name.startsWith(key)) return val;
  }
  return { bg: "from-blue-600 to-violet-600", text: "text-blue-50", icon: "📰" };
}

export function BulletinFeed({ items, currentUserId, isAdmin }: {
  items: Bulletin[];
  currentUserId?: string;
  isAdmin: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="community-card overflow-hidden">
        <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 text-4xl shadow-inner">
            📰
          </div>
          <div>
            <p className="text-lg font-black text-gray-800">No bulletins imported yet</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              BookBridge will automatically pull the latest book discoveries from curated public
              sources.{isAdmin ? " Use the panel on the right to import now." : " Check back soon!"}
            </p>
          </div>
          {isAdmin && (
            <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
              👉 Click &ldquo;Refresh bulletin feed&rdquo; in the sidebar to pull bulletins now
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((post) => {
        const theme = sourceTheme(post.sourceName);
        const dateStr = new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        });

        return (
          <article key={post.id} className="community-card overflow-visible fade-in-up">
            {/* Cover image */}
            {post.imageUrl && (
              <div className="relative overflow-hidden rounded-t-[1rem]">
                <img
                  src={post.imageUrl}
                  alt=""
                  className="h-48 w-full bg-slate-100 object-cover transition-transform duration-500 hover:scale-105"
                />
                {/* Source badge over image */}
                <div className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r ${theme.bg} px-3 py-1 text-xs font-bold shadow-lg ${theme.text}`}>
                  <span>{theme.icon}</span>
                  <span>{post.sourceName ?? "BookBridge"}</span>
                </div>
              </div>
            )}

            {/* Header row (no image case gets source badge here) */}
            {!post.imageUrl && (
              <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme.bg} text-lg shadow`}>
                  {theme.icon}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{post.sourceName ?? "BookBridge"}</p>
                  <p className="text-xs text-gray-400">{dateStr} · Book bulletin</p>
                </div>
              </header>
            )}

            {/* Body */}
            <div className="space-y-2.5 px-4 pb-3 pt-3">
              {post.imageUrl && (
                <p className="text-xs text-gray-400">{dateStr} · Book bulletin</p>
              )}
              <h2 className="text-xl font-black leading-tight text-gray-900">{post.title}</h2>
              <p className="whitespace-pre-wrap leading-7 text-gray-700">{post.body}</p>
              {post.sourceUrl && (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-100"
                >
                  <span className="flex-1 text-sm font-semibold text-blue-700">
                    Read at {post.sourceName ?? "original source"}
                  </span>
                  <span className="text-blue-400 transition-transform group-hover:translate-x-0.5">↗</span>
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 pt-1">
              <PostActions
                communityId={post.communityId}
                postId={post.id}
                isPinned={false}
                reactions={post.likes}
                currentUserId={currentUserId}
                canPin={false}
                canDelete={isAdmin}
                canReact={Boolean(currentUserId)}
              />
              <CommentSection
                communityId={post.communityId}
                postId={post.id}
                initialComments={post.comments}
                commentCount={post.commentCount}
                canComment={Boolean(currentUserId)}
                currentUserId={currentUserId}
                isMod={isAdmin}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
