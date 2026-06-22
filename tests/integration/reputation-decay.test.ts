// Integration test for src/server/reputation/decay.ts — `shouldDecayUser`
// (the pure predicate) is already unit-tested in moderation.test.ts; this
// exercises `runReputationDecay` end-to-end: does it pick the right users
// from the DB and actually write the -1 TIME_DECAY reputation event?
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakePrisma } from "../helpers/fake-prisma";

const dispatchNotifications = vi.fn();
let fakePrisma: ReturnType<typeof createFakePrisma>;
vi.mock("@/server/lib/prisma", () => ({ get prisma() { return fakePrisma; } }));
vi.mock("@/server/notifications/dispatcher", () => ({ dispatchNotifications: (...args: unknown[]) => dispatchNotifications(...args) }));

describe("reputation decay — runReputationDecay", () => {
  const now = new Date("2026-06-22T00:00:00Z");
  beforeEach(() => { dispatchNotifications.mockReset(); });

  it("decays only inactive users with positive score, skipping suspended/zero-score/recently-active ones", async () => {
    fakePrisma = createFakePrisma({
      users: [
        { id: "inactive", status: "ACTIVE", reputationScore: 40, reputationTier: "active", createdAt: new Date("2026-01-01"), lastReputationEventAt: new Date("2026-04-01") }, // > 30d ago
        { id: "recent", status: "ACTIVE", reputationScore: 40, reputationTier: "active", createdAt: new Date("2026-01-01"), lastReputationEventAt: new Date("2026-06-10") }, // < 30d ago
        { id: "suspended", status: "SUSPENDED", reputationScore: 40, reputationTier: "active", createdAt: new Date("2026-01-01"), lastReputationEventAt: new Date("2026-01-01") },
      ],
    });
    const { runReputationDecay } = await import("@/server/reputation/decay");
    const result = await runReputationDecay(now);
    expect(result.decayedUsers).toBe(1);
    const inactive = await fakePrisma.user.findUnique({ where: { id: "inactive" } });
    expect(inactive.reputationScore).toBe(39);
    const recent = await fakePrisma.user.findUnique({ where: { id: "recent" } });
    expect(recent.reputationScore).toBe(40); // untouched
    const suspended = await fakePrisma.user.findUnique({ where: { id: "suspended" } });
    expect(suspended.reputationScore).toBe(40); // untouched — the query itself excludes non-ACTIVE users
  });

  it("excludes zero-score users from the candidate query (reputationScore: { gt: 0 })", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "zero", status: "ACTIVE", reputationScore: 0, reputationTier: "new", createdAt: new Date("2026-01-01"), lastReputationEventAt: null }],
    });
    const { runReputationDecay } = await import("@/server/reputation/decay");
    const result = await runReputationDecay(now);
    expect(result.decayedUsers).toBe(0);
  });

  it("records the decay as a TIME_DECAY reputation event, not a silent score mutation", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "u1", status: "ACTIVE", reputationScore: 10, reputationTier: "new", createdAt: new Date("2026-01-01"), lastReputationEventAt: new Date("2026-04-01") }],
    });
    const { runReputationDecay } = await import("@/server/reputation/decay");
    await runReputationDecay(now);
    const events = fakePrisma.reputationEvent.rows.filter((e: any) => e.userId === "u1");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "TIME_DECAY", delta: -1 });
  });
});
