import { describe, expect, it } from "vitest";
import { ratingDelta } from "@/server/transactions/ratings";
import { scheduleDecision } from "@/server/transactions/scheduler";

describe("transaction scheduler", () => {
  const now = new Date("2026-06-04T00:00:00Z");
  it("does nothing before 14 days", () => expect(scheduleDecision(new Date("2026-05-22T00:00:01Z"), now)).toBe("none"));
  it("reminds from day 14", () => expect(scheduleDecision(new Date("2026-05-21T00:00:00Z"), now)).toBe("remind"));
  it("auto-completes from day 21", () => expect(scheduleDecision(new Date("2026-05-14T00:00:00Z"), now)).toBe("auto-complete"));
});

describe("rating reputation delta", () => {
  it("maps stars to bounded reputation changes", () => {
    expect([1, 2, 3, 4, 5].map(ratingDelta)).toEqual([-5, -3, 0, 3, 5]);
  });
});
