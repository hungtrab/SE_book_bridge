import dynamic from "next/dynamic";

const AlchemistGame = dynamic(
  () => import("@/components/artifacts/AlchemistGame").then((m) => m.AlchemistGame),
  { ssr: false, loading: () => <GameSkeleton /> },
);

export default function TheAlchemistPage() {
  return <AlchemistGame />;
}

function GameSkeleton() {
  return (
    <div className="flex items-center justify-center rounded-2xl"
      style={{ height: "calc(100vh - 6rem)", background: "#0a0a0f" }}>
      <p className="animate-pulse font-mono text-sm" style={{ color: "#c9a84c" }}>
        Loading quest...
      </p>
    </div>
  );
}
