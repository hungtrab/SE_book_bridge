import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";

export const GET = withErrorHandling(async () => {
  const u = await requireUser();
  return Response.json({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    role: u.role,
    reputationScore: u.reputationScore,
    reputationTier: u.reputationTier,
  });
});
