import dynamic from "next/dynamic";

const ArtifactGame = dynamic(
  () => import("@/components/artifacts/ArtifactGame").then((m) => m.ArtifactGame),
  { ssr: false, loading: () => <Skeleton /> },
);

export default function TucNuocVoBoPage() {
  const { STORY_NODES, INITIAL_NODE_ID } = require("@/lib/artifacts/tat-den-story");
  return <ArtifactGame storyNodes={STORY_NODES} initialNodeId={INITIAL_NODE_ID} accentColor="#8B4513" />;
}

function Skeleton() {
  return (
    <div className="flex items-center justify-center rounded-2xl"
      style={{ height: "calc(100vh - 6rem)", background: "#0a0a0f" }}>
      <p className="animate-pulse font-mono text-sm" style={{ color: "#8B4513" }}>
        Loading quest...
      </p>
    </div>
  );
}
