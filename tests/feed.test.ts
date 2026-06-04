import { describe, expect, it } from "vitest";

import { buildListingCreatedFanout } from "@/server/listings/fanout";

describe("feed fanout", () => {
  it("deduplicates a user who follows the owner and shares the community", () => {
    const out = buildListingCreatedFanout({
      listing: {
        id: "listing",
        ownerId: "owner",
        title: "Book",
        author: "Author",
        genre: "history",
        transactionType: "GIFT",
        communityId: "community",
      },
      followers: [{ followerId: "reader" }],
      communityMembers: [{ userId: "reader" }],
    });
    expect(out.feedItems).toHaveLength(1);
    expect(out.feedItems[0].payload).toMatchObject({ reasons: ["followed_owner", "community"] });
  });
});
