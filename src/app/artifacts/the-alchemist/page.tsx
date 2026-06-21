import dynamic from "next/dynamic";
import { ArtifactDiscussion } from "@/components/artifacts/ArtifactDiscussion";
import { getCurrentUser } from "@/server/lib/auth-context";

const ArtifactGame = dynamic(
  () => import("@/components/artifacts/ArtifactGame").then((m) => m.ArtifactGame),
  { ssr: false, loading: () => <Skeleton color="#c9a84c" /> },
);

export default async function TheAlchemistPage() {
  const user = await getCurrentUser();
  const { STORY_NODES, INITIAL_NODE_ID } = require("@/lib/artifacts/alchemist-story");
  const { ALCHEMIST_AUDIO } = require("@/lib/artifacts/alchemist-audio");
  return <div>
    <ArtifactGame storyNodes={STORY_NODES} initialNodeId={INITIAL_NODE_ID} accentColor="#c9a84c" audio={ALCHEMIST_AUDIO} />
    <ArtifactDiscussion slug="the-alchemist" currentUserId={user?.id} canModerate={user?.role === "ADMIN" || user?.role === "MODERATOR"} />
  </div>;
}

function Skeleton({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl"
      style={{ height: "calc(100vh - 6rem)", background: "#0a0a0f" }}>
      <p className="animate-pulse font-mono text-sm" style={{ color }}>Loading quest...</p>
    </div>
  );
}
