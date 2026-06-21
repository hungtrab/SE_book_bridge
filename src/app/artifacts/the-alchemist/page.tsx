import dynamic from "next/dynamic";

const ArtifactGame = dynamic(
  () => import("@/components/artifacts/ArtifactGame").then((m) => m.ArtifactGame),
  { ssr: false, loading: () => <Skeleton color="#c9a84c" /> },
);

export default function TheAlchemistPage() {
  const { STORY_NODES, INITIAL_NODE_ID } = require("@/lib/artifacts/alchemist-story");
  const { ALCHEMIST_AUDIO } = require("@/lib/artifacts/alchemist-audio");
  return <ArtifactGame storyNodes={STORY_NODES} initialNodeId={INITIAL_NODE_ID} accentColor="#c9a84c" audio={ALCHEMIST_AUDIO} />;
}

function Skeleton({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl"
      style={{ height: "calc(100vh - 6rem)", background: "#0a0a0f" }}>
      <p className="animate-pulse font-mono text-sm" style={{ color }}>Loading quest...</p>
    </div>
  );
}
