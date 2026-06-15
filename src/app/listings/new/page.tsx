import { requireUser } from "@/server/lib/auth-context";
import { ListingForm } from "@/components/listings/ListingForm";
import { prisma } from "@/server/lib/prisma";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ communityId?: string }>;
}) {
  const user = await requireUser();
  const { communityId } = await searchParams;
  const memberships = await prisma.communityMembership.findMany({
    where: { userId: user.id },
    include: { community: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const communities = memberships.map((membership) => membership.community);
  const preselect = communityId && communities.some((c) => c.id === communityId) ? communityId : undefined;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Create listing</h1>
      <ListingForm
        mode="create"
        communities={communities}
        initial={preselect ? { communityId: preselect } : undefined}
      />
    </div>
  );
}
