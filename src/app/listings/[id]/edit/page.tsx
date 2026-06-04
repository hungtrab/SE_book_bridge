import { ListingForm } from "@/components/listings/ListingForm";
import { ForbiddenError } from "@/server/lib/errors";
import { requireUser } from "@/server/lib/auth-context";
import { getListing } from "@/server/listings/service";
import { prisma } from "@/server/lib/prisma";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, listing] = await Promise.all([requireUser(), getListing(id)]);
  if (listing.ownerId !== user.id) throw new ForbiddenError();
  const memberships = await prisma.communityMembership.findMany({
    where: { userId: user.id },
    include: { community: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Edit listing</h1>
      <ListingForm mode="edit" initial={listing} communities={memberships.map((membership) => membership.community)} />
    </div>
  );
}
