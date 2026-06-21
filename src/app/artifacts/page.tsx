import Link from "next/link";

import { ARTIFACTS } from "@/lib/artifacts/registry";

export default function ArtifactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Interactive</p>
        <h1 className="text-3xl font-black tracking-tight">Artifacts</h1>
        <p className="mt-1 text-[color:var(--muted)]">
          Explore stories through interactive point-and-click adventures. Each artifact brings a literary classic to life.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ARTIFACTS.map((artifact) => (
          <Link
            key={artifact.slug}
            href={`/artifacts/${artifact.slug}`}
            className="card-surface interactive-card group overflow-hidden rounded-2xl"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={artifact.thumbnail}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-lg font-bold text-white">{artifact.title}</p>
                <p className="text-sm text-white/70">{artifact.subtitle}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-[color:var(--muted)]">
                {artifact.book} — {artifact.author}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: artifact.accentColor }} />
                {artifact.scenes} scenes
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
