import dynamic from "next/dynamic";

const ArtifactGame = dynamic(
  () => import("@/components/artifacts/ArtifactGame").then((m) => m.ArtifactGame),
  { ssr: false, loading: () => <Skeleton color="#8B4513" /> },
);

export default function TucNuocVoBoPage() {
  const { STORY_NODES, INITIAL_NODE_ID } = require("@/lib/artifacts/tat-den-story");
  const { TAT_DEN_AUDIO } = require("@/lib/artifacts/tat-den-audio");
  return <ArtifactGame storyNodes={STORY_NODES} initialNodeId={INITIAL_NODE_ID} accentColor="#8B4513" audio={TAT_DEN_AUDIO} />;
}

function Skeleton({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl"
      style={{ height: "calc(100vh - 6rem)", background: "#0a0a0f" }}>
      <p className="animate-pulse font-mono text-sm" style={{ color }}>Loading quest...</p>
    </div>
  );
}
