import { describe, expect, it } from "vitest";

import { genreLabel, humanizeEnum, transactionStatusLabel } from "../src/lib/labels";
import { CommunityPostCreateSchema, ReactionSchema } from "../src/server/communities/service";
import { parseRss } from "../src/server/bulletins/service";

describe("human-readable labels", () => {
  it("removes enum underscores and title-cases genres", () => {
    expect(transactionStatusLabel("IN_DELIVERY")).toBe("In delivery");
    expect(humanizeEnum("LIKE_NEW")).toBe("Like new");
    expect(genreLabel("computer-science")).toBe("Computer Science");
  });
});

describe("community reactions", () => {
  it("accepts supported Facebook-style reactions only", () => {
    expect(ReactionSchema.parse({ reaction: "LOVE" })).toEqual({ reaction: "LOVE" });
    expect(ReactionSchema.safeParse({ reaction: "FIRE" }).success).toBe(false);
  });
});

describe("community listing posts", () => {
  it("accepts an optional listing attachment", () => {
    expect(CommunityPostCreateSchema.parse({
      title: "For sale: Clean Architecture",
      body: "A detailed description of the available book.",
      listingId: "listing-123",
    })).toMatchObject({
      listingId: "listing-123",
      isPinned: false,
    });
  });
});

describe("book bulletin RSS parsing", () => {
  it("keeps attribution metadata and a short clean summary", () => {
    const rows = parseRss(`
      <rss><channel><item>
        <title><![CDATA[New exhibition explores reading history]]></title>
        <link>https://example.org/books/story</link>
        <guid>story-123</guid>
        <pubDate>Fri, 19 Jun 2026 10:00:00 GMT</pubDate>
        <description><![CDATA[<p>A short <strong>book</strong> story.</p>]]></description>
      </item></channel></rss>
    `, "Example Books");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sourceName: "Example Books",
      externalId: "story-123",
      sourceUrl: "https://example.org/books/story",
      summary: "A short book story.",
    });
  });
});
