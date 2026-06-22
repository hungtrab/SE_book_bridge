// Integration tests for src/server/admin/stats.ts and exports.ts —
// previously completely untested (the original test suite only covered
// pure logic in other modules).
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakePrisma } from "../helpers/fake-prisma";
import { csvCell } from "@/server/admin/exports";

let fakePrisma: ReturnType<typeof createFakePrisma>;
vi.mock("@/server/lib/prisma", () => ({ get prisma() { return fakePrisma; } }));

describe("admin stats — getPlatformStats", () => {
  beforeEach(() => {
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", status: "ACTIVE" }, { id: "u2", status: "ACTIVE" }, { id: "u3", status: "SUSPENDED" }],
      transactions: [{ id: "t1", status: "COMPLETED" }, { id: "t2", status: "PENDING" }],
      listings: [{ id: "l1", status: "ACTIVE" }, { id: "l2", status: "REMOVED" }],
      communities: [{ id: "c1" }, { id: "c2" }],
      reports: [{ id: "r1", status: "PENDING" }, { id: "r2", status: "RESOLVED" }],
      notifications: [{ id: "n1", readAt: null }, { id: "n2", readAt: new Date() }],
    });
  });

  it("only counts ACTIVE users, COMPLETED transactions, ACTIVE listings, PENDING reports, and unread notifications", async () => {
    const { getPlatformStats } = await import("@/server/admin/stats");
    const stats = await getPlatformStats();
    expect(stats.activeUsers).toBe(2);
    expect(stats.completedTransactions).toBe(1);
    expect(stats.booksCirculated).toBe(1); // mirrors completedTransactions
    expect(stats.activeListings).toBe(1);
    expect(stats.communities).toBe(2);
    expect(stats.pendingReports).toBe(1);
    expect(stats.unreadNotifications).toBe(1);
  });
});

describe("admin stats — grantMetrics", () => {
  it("only counts rows created/completed inside the [from, to] window", async () => {
    fakePrisma = createFakePrisma({
      users: [
        { id: "u1", createdAt: new Date("2026-05-15") }, // inside
        { id: "u2", createdAt: new Date("2026-04-01") }, // before window
      ],
      transactions: [
        { id: "t1", completedAt: new Date("2026-05-20") }, // inside
        { id: "t2", completedAt: new Date("2026-07-01") }, // after window
      ],
      listings: [{ id: "l1", createdAt: new Date("2026-05-10") }],
      communities: [{ id: "c1", createdAt: new Date("2026-05-10") }],
    });
    const { grantMetrics } = await import("@/server/admin/stats");
    const result = await grantMetrics(new Date("2026-05-01"), new Date("2026-05-31"));
    expect(result).toMatchObject({ newUsers: 1, completedTransactions: 1, booksCirculated: 1, newListings: 1, newCommunities: 1 });
  });
});

describe("admin exports — buildGrantReport", () => {
  beforeEach(() => {
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", createdAt: new Date("2026-06-01") }],
      transactions: [],
      listings: [],
      communities: [],
    });
  });

  it("rejects a from-date after the to-date", async () => {
    const { buildGrantReport } = await import("@/server/admin/exports");
    await expect(buildGrantReport("2026-06-20", "2026-06-01")).rejects.toThrow("from must be before to");
  });

  it("rejects an unparsable date string", async () => {
    const { buildGrantReport } = await import("@/server/admin/exports");
    await expect(buildGrantReport("not-a-date", undefined)).rejects.toThrow("Invalid date");
  });

  it("produces a CSV with the metric rows and respects the requested date window", async () => {
    const { buildGrantReport } = await import("@/server/admin/exports");
    const csv = await buildGrantReport("2026-06-01", "2026-06-30");
    expect(csv).toContain('"New users","1"');
    expect(csv).toContain("BookBridge Grant Report");
  });
});

describe("admin exports — csvCell (CSV/formula-injection guard)", () => {
  it("quotes plain values and escapes embedded quotes", () => {
    expect(csvCell("hello")).toBe('"hello"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(42)).toBe('"42"');
    expect(csvCell(null)).toBe('""');
  });

  it("neutralises values that would be interpreted as spreadsheet formulas", () => {
    expect(csvCell("=cmd|'/c calc'!A1")).toBe("\"'=cmd|'/c calc'!A1\"");
    expect(csvCell("+1+1")).toBe("\"'+1+1\"");
    expect(csvCell("-1+1")).toBe("\"'-1+1\"");
    expect(csvCell("@SUM(1+1)")).toBe("\"'@SUM(1+1)\"");
  });
});
