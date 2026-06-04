import { requireUser } from "@/server/lib/auth-context";
import { ListingForm } from "@/components/listings/ListingForm";
import { prisma } from "@/server/lib/prisma";

export default async function NewListingPage() {
  const user = await requireUser();
  const memberships = await prisma.communityMembership.findMany({
    where: { userId: user.id },
    include: { community: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Create listing</h1>
      <ListingForm mode="create" communities={memberships.map((membership) => membership.community)} />
    </div>
  );
}
