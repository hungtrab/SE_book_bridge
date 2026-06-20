"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SOURCE_LABELS: Record<string, string> = {
  openLibrary: "Open Library",
  libraryOfCongress: "Library of Congress",
  projectGutenberg: "Project Gutenberg",
  internetArchive: "Internet Archive",
  newYorkTimes: "NYT Best Sellers",
};

export function BulletinImportPanel() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    fetched: number;
    sources: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/communities/bulletins/import", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Bulletin import failed. Check server logs.");
      } else {
        setResult(body);
        router.refresh();
      }
    } catch {
      setError("Network error — could not reach the bulletin import service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="community-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-violet-50 px-4 py-3">
        <span className="text-lg">📰</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Admin</p>
          <h3 className="text-sm font-black text-gray-900">Bulletin sources</h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-gray-500">
          BookBridge pulls book news from{" "}
          <strong className="text-gray-700">Open Library</strong>,{" "}
          <strong className="text-gray-700">Library of Congress</strong>,{" "}
          <strong className="text-gray-700">Project Gutenberg</strong>,{" "}
          <strong className="text-gray-700">Internet Archive</strong>, and{" "}
          <strong className="text-gray-700">NYT Best Sellers</strong> when configured.
        </p>

        <button
          type="button"
          onClick={handleImport}
          disabled={pending}
          className="btn-primary w-full py-2 text-sm"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Importing…
            </span>
          ) : (
            "🔄 Refresh bulletin feed"
          )}
        </button>

        {/* Success result */}
        {result && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs">
            <p className="font-bold text-green-700">
              ✅ {result.created} new · {result.skipped} already existed
            </p>
            <ul className="mt-1.5 space-y-0.5 text-green-600">
              {Object.entries(result.sources).map(([source, count]) => (
                <li key={source}>{SOURCE_LABELS[source] ?? source}: {count}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}
