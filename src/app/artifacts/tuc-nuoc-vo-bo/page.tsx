import dynamic from "next/dynamic";
import { ArtifactDiscussion } from "@/components/artifacts/ArtifactDiscussion";
import { getCurrentUser } from "@/server/lib/auth-context";

const ArtifactGame = dynamic(
  () => import("@/components/artifacts/ArtifactGame").then((m) => m.ArtifactGame),
  { ssr: false, loading: () => <Skeleton color="#8B4513" /> },
);

export default async function TucNuocVoBoPage() {
  const user = await getCurrentUser();
  const { STORY_NODES, INITIAL_NODE_ID } = require("@/lib/artifacts/tat-den-story");
  const { TAT_DEN_AUDIO } = require("@/lib/artifacts/tat-den-audio");
  return <div>
    <ArtifactGame
      storyNodes={STORY_NODES}
      initialNodeId={INITIAL_NODE_ID}
      accentColor="#8B4513"
      audio={TAT_DEN_AUDIO}
      listingSearchTitle="Tắt Đèn"
    />
    <ArtifactDiscussion slug="tuc-nuoc-vo-bo" currentUserId={user?.id} canModerate={user?.role === "ADMIN" || user?.role === "MODERATOR"} />
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
