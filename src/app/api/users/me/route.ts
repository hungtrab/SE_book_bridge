import { clearSession, requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { deleteMyAccount, ProfileUpdateSchema, updateMyProfile } from "@/server/users/service";

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

export const PATCH = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const updated = await updateMyProfile(user.id, parsed.data);
  return Response.json(updated);
});

export const DELETE = withErrorHandling(async () => {
  const user = await requireUser();
  const deleted = await deleteMyAccount(user.id);
  await clearSession();
  return Response.json({ id: deleted.id, status: deleted.status });
});
