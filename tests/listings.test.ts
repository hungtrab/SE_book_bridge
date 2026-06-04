import { afterEach, describe, expect, it, vi } from "vitest";

import { lookupIsbn } from "@/server/listings/isbn";
import { buildListingCreatedFanout } from "@/server/listings/fanout";
import { hasActiveListingTransaction, listingPatchChangesPendingRequestFields } from "@/server/listings/service";
import { IsbnSchema, ListingCreateSchema } from "@/server/listings/validation";

const validListing = {
  title: "Clean Code",
  author: "Robert C. Martin",
  genre: "software",
  condition: "GOOD",
  description: "A practical book for learning code quality and refactoring.",
  transactionType: "GIFT",
  photoUrls: ["https://example.com/photo.jpg"],
};

describe("listing validation", () => {
  it("normalizes ISBN hyphen and whitespace", () => {
    expect(IsbnSchema.parse("978-0-06-093546-7")).toBe("9780060935467");
    expect(IsbnSchema.parse("0 306 40615 2")).toBe("0306406152");
  });

  it("enforces the symbolic sell price cap", () => {
    expect(ListingCreateSchema.safeParse({
      ...validListing,
      transactionType: "SELL",
      askingPriceVnd: 100_000,
    }).success).toBe(false);

    expect(ListingCreateSchema.safeParse({
      ...validListing,
      transactionType: "SELL",
      askingPriceVnd: 50_000,
    }).success).toBe(true);
  });

  it("rejects askingPriceVnd for non-sell listings", () => {
    expect(ListingCreateSchema.safeParse({
      ...validListing,
      transactionType: "GIFT",
      askingPriceVnd: 10_000,
    }).success).toBe(false);
  });

  it("allows creating a listing without photos for quick demos", () => {
    const { photoUrls: _photoUrls, ...withoutPhotos } = validListing;

    expect(ListingCreateSchema.safeParse(withoutPhotos).success).toBe(true);
    expect(ListingCreateSchema.safeParse({ ...validListing, photoUrls: [] }).success).toBe(true);
    expect(ListingCreateSchema.safeParse({
      ...validListing,
      photoUrls: Array.from({ length: 6 }, (_, index) => `https://example.com/photo-${index}.jpg`),
    }).success).toBe(false);
  });
});

describe("listing edit guard", () => {
  it("blocks edit only for accepted or in-delivery transactions", () => {
    expect(hasActiveListingTransaction(["PENDING"])).toBe(false);
    expect(hasActiveListingTransaction(["ACCEPTED"])).toBe(true);
    expect(hasActiveListingTransaction(["IN_DELIVERY"])).toBe(true);
  });

  it("notifies pending requesters only when condition or price changes", () => {
    const listing = { condition: "GOOD", askingPriceVnd: 20_000 };
    expect(listingPatchChangesPendingRequestFields(listing, { condition: "LIKE_NEW" })).toBe(true);
    expect(listingPatchChangesPendingRequestFields(listing, { askingPriceVnd: 25_000 })).toBe(true);
    expect(listingPatchChangesPendingRequestFields(listing, { condition: "GOOD" })).toBe(false);
    expect(listingPatchChangesPendingRequestFields(listing, {})).toBe(false);
  });
});

describe("ISBN lookup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps Open Library metadata into listing defaults", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({
        title: "Sapiens",
        authors: [{ key: "/authors/OL123A" }],
        publishers: ["Harper"],
        publish_date: "February 10, 2015",
        languages: [{ key: "/languages/eng" }],
        subjects: ["History"],
        covers: [12345],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        name: "Yuval Noah Harari",
      }), { status: 200 }));

    const out = await lookupIsbn("978-0-06-093546-7");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out).toMatchObject({
      isbn: "9780060935467",
      title: "Sapiens",
      author: "Yuval Noah Harari",
      publisher: "Harper",
      publicationYear: 2015,
      language: "eng",
      genre: "history",
      coverUrl: "https://covers.openlibrary.org/b/id/12345-L.jpg",
    });
  });
});

describe("listing.created fanout", () => {
  it("writes one feed item per recipient and notifications per source", () => {
    const rows = buildListingCreatedFanout({
      listing: {
        id: "listing-1",
        ownerId: "owner-1",
        title: "Sapiens",
        author: "Yuval Noah Harari",
        genre: "history",
        transactionType: "GIFT",
        communityId: "community-1",
      },
      followers: [{ followerId: "user-a" }, { followerId: "user-b" }],
      communityMembers: [{ userId: "owner-1" }, { userId: "user-b" }, { userId: "user-c" }],
    });

    expect(rows.feedItems.map((row) => row.userId).sort()).toEqual(["user-a", "user-b", "user-c"]);
    expect(rows.notifications).toHaveLength(4);
    expect(rows.notifications.map((row) => row.kind).sort()).toEqual([
      "COMMUNITY_ANNOUNCEMENT",
      "COMMUNITY_ANNOUNCEMENT",
      "NEW_LISTING_FROM_FOLLOWED",
      "NEW_LISTING_FROM_FOLLOWED",
    ]);
  });
});
