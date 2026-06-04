// State-machine tests — pure logic, no DB needed.

import { describe, expect, it } from "vitest";

import type { TransactionStatus } from "@prisma/client";
import { transition, type TxnAction } from "@/server/transactions/state-machine";

const ALL_STATES: TransactionStatus[] = [
  "PENDING", "ACCEPTED", "DECLINED", "WAITLISTED",
  "IN_DELIVERY", "COMPLETED", "CANCELLED", "DISPUTED",
];

describe("transaction state machine — happy paths", () => {
  it("PENDING -> ACCEPTED on owner accept", () => {
    const r = transition("PENDING", { kind: "accept", actor: "owner" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.next).toBe("ACCEPTED");
    expect(r.sideEffects).toContainEqual({ kind: "listing-status", status: "RESERVED" });
  });

  it("ACCEPTED -> IN_DELIVERY on owner ship", () => {
    const r = transition("ACCEPTED", { kind: "ship", actor: "owner" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.next).toBe("IN_DELIVERY");
    expect(r.sideEffects.some(e => e.kind === "schedule-reminder")).toBe(true);
  });

  it("IN_DELIVERY -> COMPLETED on requester confirm", () => {
    const r = transition("IN_DELIVERY", { kind: "complete", actor: "requester" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.next).toBe("COMPLETED");
    // both parties get +10 reputation
    const repEffects = r.sideEffects.filter(e => e.kind === "reputation");
    expect(repEffects).toHaveLength(2);
    for (const e of repEffects) {
      if (e.kind === "reputation") expect(e.delta).toBe(10);
    }
  });

  it("IN_DELIVERY -> COMPLETED on system auto-complete", () => {
    const r = transition("IN_DELIVERY", { kind: "complete", actor: "system" });
    expect(r.ok).toBe(true);
  });

  it("either party can cancel from PENDING or ACCEPTED", () => {
    for (const s of ["PENDING", "ACCEPTED"] as TransactionStatus[]) {
      for (const a of ["owner", "requester"] as const) {
        const r = transition(s, { kind: "cancel", actor: a });
        expect(r.ok).toBe(true);
        if (!r.ok) continue;
        expect(r.next).toBe("CANCELLED");
        // The cancelling party loses reputation.
        const rep = r.sideEffects.find(e => e.kind === "reputation");
        expect(rep).toBeDefined();
      }
    }
  });
});

describe("transaction state machine — illegal transitions", () => {
  it("rejects accept by requester", () => {
    const r = transition("PENDING", { kind: "accept", actor: "requester" as never });
    expect(r.ok).toBe(false);
  });

  it("rejects ship from PENDING", () => {
    const r = transition("PENDING", { kind: "ship", actor: "owner" });
    expect(r.ok).toBe(false);
  });

  it("rejects complete from ACCEPTED", () => {
    const r = transition("ACCEPTED", { kind: "complete", actor: "requester" });
    expect(r.ok).toBe(false);
  });

  it("rejects cancel from terminal states", () => {
    for (const s of ["COMPLETED", "DECLINED", "CANCELLED"] as TransactionStatus[]) {
      const r = transition(s, { kind: "cancel", actor: "owner" });
      expect(r.ok).toBe(false);
    }
  });
});

describe("transaction state machine — moderator actions", () => {
  it("moderator can resolve a DISPUTED txn to COMPLETED", () => {
    const r = transition("DISPUTED", { kind: "moderate-resolve", actor: "moderator" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.next).toBe("COMPLETED");
    expect(r.sideEffects).toContainEqual({ kind: "listing-status", status: "COMPLETED" });
    expect(r.sideEffects).toContainEqual({ kind: "notify", userKey: "owner", event: "dispute_resolved" });
    expect(r.sideEffects).toContainEqual({ kind: "notify", userKey: "requester", event: "dispute_resolved" });
  });

  it("moderator can reject a DISPUTED txn back to CANCELLED", () => {
    const r = transition("DISPUTED", { kind: "moderate-reject", actor: "moderator" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.next).toBe("CANCELLED");
    expect(r.sideEffects).toContainEqual({ kind: "listing-status", status: "ACTIVE" });
    expect(r.sideEffects).toContainEqual({ kind: "notify", userKey: "owner", event: "dispute_rejected" });
    expect(r.sideEffects).toContainEqual({ kind: "notify", userKey: "requester", event: "dispute_rejected" });
  });

  it("moderator cannot moderate a non-disputed transaction", () => {
    const r = transition("PENDING", { kind: "moderate-resolve", actor: "moderator" });
    expect(r.ok).toBe(false);
  });
});

describe("transaction state machine — total coverage check", () => {
  // Ensures we don't accidentally hit a 'never' branch that returns undefined.
  const all_actions: TxnAction[] = [
    { kind: "accept", actor: "owner" },
    { kind: "decline", actor: "owner" },
    { kind: "cancel", actor: "owner" },
    { kind: "cancel", actor: "requester" },
    { kind: "ship", actor: "owner" },
    { kind: "complete", actor: "requester" },
    { kind: "complete", actor: "system" },
    { kind: "rate", actor: "requester" },
    { kind: "dispute", actor: "owner" },
    { kind: "dispute", actor: "requester" },
    { kind: "moderate-resolve", actor: "moderator" },
    { kind: "moderate-reject", actor: "moderator" },
  ];

  it("transition() returns a defined value for every (state, action) pair", () => {
    for (const s of ALL_STATES) {
      for (const a of all_actions) {
        const r = transition(s, a);
        expect(r).toBeDefined();
        expect(typeof r.ok).toBe("boolean");
      }
    }
  });
});
