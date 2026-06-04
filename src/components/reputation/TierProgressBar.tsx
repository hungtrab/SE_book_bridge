import { tierForScore } from "@/server/reputation/scoring";

export function TierProgressBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tier = tierForScore(clamped);
  const next = tier === "new" ? 20 : tier === "active" ? 50 : tier === "trusted" ? 80 : 100;
  return (
    <div>
      <div className="h-2 overflow-hidden rounded bg-gray-200">
        <div className="h-full bg-blue-600" style={{ width: `${clamped}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {tier === "champion" ? "Highest reputation tier" : `${next - clamped} points to next tier`}
      </p>
    </div>
  );
}
