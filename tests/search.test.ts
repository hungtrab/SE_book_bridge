import { describe, expect, it } from "vitest";

import { districtsWithinRadius, haversineKm } from "@/server/search/districts";
import { parseSearchQuery } from "@/server/search/query-parser";
import { likePattern, searchTerms } from "@/server/search/service";

describe("search query parser", () => {
  it("extracts qualified filters and keeps free text", () => {
    expect(parseSearchQuery('sapiens author:"Yuval Noah Harari" genre:history type:gift')).toEqual({
      text: "sapiens",
      filters: { author: "Yuval Noah Harari", genre: "history", type: "gift" },
    });
  });

  it("keeps unknown qualifiers as free text", () => {
    expect(parseSearchQuery("language:vi clean code").text).toBe("language:vi clean code");
  });
});

describe("district radius", () => {
  it("uses district centroids instead of exact user coordinates", () => {
    const nearby = districtsWithinRadius("Cau Giay", 5);
    expect(nearby).toContain("Cau Giay");
    expect(nearby).toContain("Dong Da");
    expect(nearby).not.toContain("Long Bien");
  });

  it("computes zero distance for the same centroid", () => {
    expect(haversineKm({ lat: 21, lng: 105 }, { lat: 21, lng: 105 })).toBe(0);
  });
});

describe("search SQL helpers", () => {
  it("escapes LIKE wildcard characters from user input", () => {
    expect(likePattern("100% clean_code\\book")).toBe("%100\\% clean\\_code\\\\book%");
  });

  it("keeps meaningful artifact title terms for fallback matching", () => {
    expect(searchTerms("The Alchemist")).toEqual(["Alchemist"]);
  });
});
