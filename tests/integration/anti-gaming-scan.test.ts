// Integration tests for src/server/reputation/scan.ts — the cron job that
// runs the pure anti-gaming heuristics (already unit-tested in
// reputation.test.ts) against real completed transactions and writes
// system-generated Reports for the moderation queue to review.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakePrisma } from "../helpers/fake-prisma";

let fakePrisma: ReturnType<typeof createFakePrisma>;
vi.mock("@/server/lib/prisma", () => ({ get prisma() { return fakePrisma; } }));

describe("anti-gaming scan", () => {
  beforeEach(() => {
    fakePrisma = createFakePrisma({
      transactions: [
        { id: "t1", ownerId: "alice", requesterId: "bob", status: "COMPLETED" },
        { id: "t2", ownerId: "bob", requesterId: "alice", status: "COMPLETED" },
        { id: "t3", ownerId: "alice", requesterId: "bob", status: "COMPLETED" },
        { id: "t4", ownerId: "carol", requesterId: "dave", status: "PENDING" }, // not completed — must be ignored
      ],
    });
  });

  it("flags a reciprocal-only pair and creates one system report per flagged user", async () => {
    const { runAntiGamingScan } = await import("@/server/reputation/scan");
    const result = await runAntiGamingScan();
    expect(result.scannedTransactions).toBe(3); // t4 (PENDING) excluded by the query
    expect(result.flaggedUsers).toBe(2);
    expect(result.reportsCreated).toBe(2);

    const aliceReport = fakePrisma.report.rows.find((r: any) => r.targetUserId === "alice");
    expect(aliceReport).toMatchObject({ isSystemGenerated: true, targetType: "USER", reason: "ANTI_GAMING_FLAG" });
    expect(aliceReport.details).toContain("reciprocal-only pair with bob");
  });

  it("does not duplicate a flag for a user who already has a pending or recent system report", async () => {
    fakePrisma.report.rows.push({
      id: "existing", targetUserId: "alice", isSystemGenerated: true, reason: "ANTI_GAMING_FLAG",
      status: "PENDING", createdAt: new Date(),
    });
    const { runAntiGamingScan } = await import("@/server/reputation/scan");
    const result = await runAntiGamingScan();
    // alice already flagged (skipped); bob still gets a fresh report.
    expect(result.reportsCreated).toBe(1);
    expect(fakePrisma.report.rows.filter((r: any) => r.targetUserId === "alice")).toHaveLength(1);
  });

  it("does not flag a healthy trading graph with diverse, non-closed counterparties", async () => {
    fakePrisma = createFakePrisma({
      transactions: [
        { id: "t1", ownerId: "alice", requesterId: "bob", status: "COMPLETED" },
        { id: "t2", ownerId: "alice", requesterId: "carol", status: "COMPLETED" },
        { id: "t3", ownerId: "bob", requesterId: "dave", status: "COMPLETED" }, // dave: 1 partner only, breaks closure
        { id: "t4", ownerId: "carol", requesterId: "eve", status: "COMPLETED" }, // eve: 1 partner only, breaks closure
      ],
    });
    const { runAntiGamingScan } = await import("@/server/reputation/scan");
    const result = await runAntiGamingScan();
    expect(result.flaggedUsers).toBe(0);
    expect(result.reportsCreated).toBe(0);
  });

  it("flags a closed 3-person collusion ring with a combined report reason", async () => {
    fakePrisma = createFakePrisma({
      transactions: [
        { id: "t1", ownerId: "a", requesterId: "b", status: "COMPLETED" },
        { id: "t2", ownerId: "b", requesterId: "c", status: "COMPLETED" },
        { id: "t3", ownerId: "c", requesterId: "a", status: "COMPLETED" },
      ],
    });
    const { runAntiGamingScan } = await import("@/server/reputation/scan");
    const result = await runAntiGamingScan();
    expect(result.flaggedUsers).toBe(3);
    const reportForA = fakePrisma.report.rows.find((r: any) => r.targetUserId === "a");
    expect(reportForA.details).toContain("closed trading group");
  });
});
