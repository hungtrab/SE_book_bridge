import { tierForScore, tierLabel } from "@/server/reputation/scoring";

const colors = {
  new: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-800",
  trusted: "bg-emerald-100 text-emerald-800",
  champion: "bg-amber-100 text-amber-800",
};

export function ReputationBadge({ score }: { score: number }) {
  const tier = tierForScore(score);
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colors[tier]}`}>
      {tierLabel(tier)} · {score}
    </span>
  );
}
