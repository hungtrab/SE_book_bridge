// Integration tests for src/server/reputation/service.ts against an in-memory
// fake Prisma client (see tests/helpers/fake-prisma.ts) — the real DB isn't
// available in this environment, so we exercise the actual transaction logic
// (clamping, tier-change notifications, drift prevention) against a fake store
// instead of just the pure scoring helpers already covered in reputation.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakePrisma } from "../helpers/fake-prisma";

const dispatchNotifications = vi.fn();
let fakePrisma: ReturnType<typeof createFakePrisma>;

vi.mock("@/server/lib/prisma", () => ({ get prisma() { return fakePrisma; } }));
vi.mock("@/server/notifications/dispatcher", () => ({ dispatchNotifications: (...args: unknown[]) => dispatchNotifications(...args) }));

describe("reputation service — addReputationEvent", () => {
  beforeEach(() => {
    dispatchNotifications.mockReset();
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", reputationScore: 18, reputationTier: "new", lastReputationEventAt: null }],
    });
  });
  afterEach(() => { vi.resetModules(); });

  it("adds a positive delta and stores the exact delta when no clamping is needed", async () => {
    const { addReputationEvent } = await import("@/server/reputation/service");
    const result = await addReputationEvent(fakePrisma as any, { userId: "u1", kind: "TRANSACTION_COMPLETED", delta: 10 });
    expect(result.score).toBe(28);
    expect(result.effectiveDelta).toBe(10);
    expect(result.tier).toBe("active");
    const user = await fakePrisma.user.findUnique({ where: { id: "u1" } });
    expect(user.reputationScore).toBe(28);
    expect(user.reputationTier).toBe("active");
  });

  it("clamps the score at 100 and records only the effective (clamped) delta — no drift", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", reputationScore: 95, reputationTier: "champion", lastReputationEventAt: null }],
    });
    const { addReputationEvent } = await import("@/server/reputation/service");
    const result = await addReputationEvent(fakePrisma as any, { userId: "u1", kind: "TRANSACTION_COMPLETED", delta: 10 });
    expect(result.score).toBe(100);
    expect(result.effectiveDelta).toBe(5); // not 10 — clamped
    const event = fakePrisma.reputationEvent.rows.at(-1);
    expect(event.delta).toBe(5);
  });

  it("clamps the score at 0 and does not go negative even with a large penalty", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", reputationScore: 5, reputationTier: "new", lastReputationEventAt: null }],
    });
    const { addReputationEvent } = await import("@/server/reputation/service");
    const result = await addReputationEvent(fakePrisma as any, { userId: "u1", kind: "REPORT_UPHELD", delta: -15 });
    expect(result.score).toBe(0);
    expect(result.effectiveDelta).toBe(-5);
  });

  it("fires a tier_changed notification only when the tier actually crosses a boundary", async () => {
    const { addReputationEvent } = await import("@/server/reputation/service");
    // 18 -> 28: new -> active, tier DID change
    await addReputationEvent(fakePrisma as any, { userId: "u1", kind: "TRANSACTION_COMPLETED", delta: 10 });
    expect(dispatchNotifications).toHaveBeenCalledTimes(1);
    expect(dispatchNotifications.mock.calls[0][1]).toMatchObject({ kind: "reputation.tier_changed", tier: "active" });

    dispatchNotifications.mockReset();
    // 28 -> 31: still "active", tier did NOT change — no notification spam
    await addReputationEvent(fakePrisma as any, { userId: "u1", kind: "TRANSACTION_COMPLETED", delta: 3 });
    expect(dispatchNotifications).not.toHaveBeenCalled();
  });

  it("does not drift the running score across many small clamped events", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", reputationScore: 99, reputationTier: "champion", lastReputationEventAt: null }],
    });
    const { addReputationEvent } = await import("@/server/reputation/service");
    for (let i = 0; i < 5; i += 1) {
      await addReputationEvent(fakePrisma as any, { userId: "u1", kind: "TRANSACTION_COMPLETED", delta: 10 });
    }
    const user = await fakePrisma.user.findUnique({ where: { id: "u1" } });
    expect(user.reputationScore).toBe(100); // never exceeds the ceiling
    const totalRecorded = fakePrisma.reputationEvent.rows.reduce((sum: number, e: any) => sum + e.delta, 0);
    expect(totalRecorded).toBe(1); // only the first event (99 -> 100) had any effective delta
  });

  it("throws NotFoundError for an unknown user", async () => {
    const { addReputationEvent } = await import("@/server/reputation/service");
    await expect(addReputationEvent(fakePrisma as any, { userId: "ghost", kind: "TRANSACTION_COMPLETED", delta: 10 }))
      .rejects.toThrow("User not found");
  });
});

describe("reputation service — getReputation", () => {
  beforeEach(() => {
    dispatchNotifications.mockReset();
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", displayName: "Alice", reputationScore: 55, reputationTier: "trusted" }],
      reputationEvents: [
        { id: "e1", userId: "u1", kind: "TRANSACTION_COMPLETED", delta: 10, createdAt: new Date("2026-01-01") },
        { id: "e2", userId: "u1", kind: "TRANSACTION_COMPLETED", delta: 10, createdAt: new Date("2026-01-02") },
        { id: "e3", userId: "u1", kind: "REPORT_UPHELD", delta: -15, createdAt: new Date("2026-01-03") },
      ],
    });
  });

  it("groups events by kind and labels the tier", async () => {
    const { getReputation } = await import("@/server/reputation/service");
    const result = await getReputation("u1");
    expect(result.tier).toBe("trusted");
    expect(result.tierLabel).toBe("Trusted Contributor");
    const txnGroup = result.breakdown.find((b: any) => b.kind === "TRANSACTION_COMPLETED");
    expect(txnGroup).toMatchObject({ delta: 20, count: 2 });
    const reportGroup = result.breakdown.find((b: any) => b.kind === "REPORT_UPHELD");
    expect(reportGroup).toMatchObject({ delta: -15, count: 1 });
    expect(result.recentEvents).toHaveLength(3);
  });

  it("throws NotFoundError for an unknown user", async () => {
    const { getReputation } = await import("@/server/reputation/service");
    await expect(getReputation("ghost")).rejects.toThrow("User not found");
  });
});
