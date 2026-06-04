// state-machine.ts — pure state machine for a transaction.
//
// Intentionally separated from Prisma so it can be tested without a DB.
// The owning module (`src/server/transactions/service.ts`) loads the row,
// passes the current status + the requested action here, and persists the
// result.

import type { TransactionStatus, UserRole } from "@prisma/client";

export type TxnAction =
  | { kind: "accept";   actor: "owner" }
  | { kind: "decline";  actor: "owner" }
  | { kind: "cancel";   actor: "owner" | "requester" }
  | { kind: "ship";     actor: "owner" }
  | { kind: "complete"; actor: "requester" | "system" }
  | { kind: "rate";     actor: "owner" | "requester" }
  | { kind: "dispute";  actor: "owner" | "requester" }
  | { kind: "moderate-resolve"; actor: "moderator" }
  | { kind: "moderate-reject";  actor: "moderator" };

// Outcome of asking "can this action transition this state?".
export type TxnTransition =
  | { ok: true;  next: TransactionStatus; sideEffects: SideEffect[] }
  | { ok: false; reason: string };

export type SideEffect =
  | { kind: "notify"; userKey: "owner" | "requester"; event: string }
  | { kind: "listing-status"; status: "RESERVED" | "ACTIVE" | "COMPLETED" }
  | { kind: "reputation"; userKey: "owner" | "requester"; delta: number; reason: string }
  | { kind: "schedule-reminder"; days: number };

const T = {
  PENDING:     "PENDING",
  ACCEPTED:    "ACCEPTED",
  DECLINED:    "DECLINED",
  WAITLISTED:  "WAITLISTED",
  IN_DELIVERY: "IN_DELIVERY",
  COMPLETED:   "COMPLETED",
  CANCELLED:   "CANCELLED",
  DISPUTED:    "DISPUTED",
} as const satisfies Record<string, TransactionStatus>;

/**
 * Decide whether ``action`` is legal in ``current`` state, and if so what
 * the next state is plus what side-effects the caller must apply.
 */
export function transition(
  current: TransactionStatus,
  action: TxnAction,
): TxnTransition {
  switch (action.kind) {
    case "accept":
      if (action.actor !== "owner")
        return deny("Only the listing owner can accept a request");
      if (current !== T.PENDING)
        return deny(`Cannot accept a transaction in ${current}`);
      return ok(T.ACCEPTED, [
        { kind: "listing-status", status: "RESERVED" },
        { kind: "notify",         userKey: "requester", event: "accepted" },
      ]);

    case "decline":
      if (action.actor !== "owner")
        return deny("Only the owner can decline a request");
      if (current !== T.PENDING)
        return deny(`Cannot decline in ${current}`);
      return ok(T.DECLINED, [
        { kind: "notify", userKey: "requester", event: "declined" },
      ]);

    case "cancel":
      if (current !== T.PENDING && current !== T.ACCEPTED)
        return deny(`Cannot cancel in ${current}`);
      return ok(T.CANCELLED, [
        { kind: "listing-status", status: "ACTIVE" },
        // small reputation penalty for the cancelling party
        { kind: "reputation",
          userKey: action.actor === "owner" ? "owner" : "requester",
          delta: -3,
          reason: "transaction_cancelled" },
        { kind: "notify",
          userKey: action.actor === "owner" ? "requester" : "owner",
          event: "cancelled" },
      ]);

    case "ship":
      if (action.actor !== "owner")
        return deny("Only the owner can mark as shipped");
      if (current !== T.ACCEPTED)
        return deny(`Cannot ship in ${current}`);
      return ok(T.IN_DELIVERY, [
        { kind: "schedule-reminder", days: 14 },
        { kind: "notify", userKey: "requester", event: "shipped" },
      ]);

    case "complete":
      // Requester confirms receipt OR the 21-day system auto-complete fires.
      if (current !== T.IN_DELIVERY)
        return deny(`Cannot complete in ${current}`);
      return ok(T.COMPLETED, [
        { kind: "listing-status", status: "COMPLETED" },
        { kind: "reputation", userKey: "owner",     delta: 10, reason: "transaction_completed" },
        { kind: "reputation", userKey: "requester", delta: 10, reason: "transaction_completed" },
        { kind: "notify", userKey: "owner",     event: "completed" },
        { kind: "notify", userKey: "requester", event: "completed" },
      ]);

    case "rate":
      // Ratings are recorded after Completed; not a status change.
      if (current !== T.COMPLETED)
        return deny("Can only rate a completed transaction");
      return ok(T.COMPLETED, []);   // status unchanged; rating handled separately

    case "dispute":
      if (current !== T.IN_DELIVERY && current !== T.COMPLETED)
        return deny(`Cannot dispute in ${current}`);
      return ok(T.DISPUTED, [
        { kind: "notify", userKey: "owner",     event: "disputed" },
        { kind: "notify", userKey: "requester", event: "disputed" },
      ]);

    case "moderate-resolve":
      if (current !== T.DISPUTED)
        return deny("Can only resolve a dispute from DISPUTED");
      return ok(T.COMPLETED, [
        { kind: "listing-status", status: "COMPLETED" },
        { kind: "notify", userKey: "owner",     event: "dispute_resolved" },
        { kind: "notify", userKey: "requester", event: "dispute_resolved" },
      ]);

    case "moderate-reject":
      if (current !== T.DISPUTED)
        return deny("Can only reject a dispute from DISPUTED");
      return ok(T.CANCELLED, [
        { kind: "listing-status", status: "ACTIVE" },
        { kind: "notify", userKey: "owner",     event: "dispute_rejected" },
        { kind: "notify", userKey: "requester", event: "dispute_rejected" },
      ]);
  }
}

function ok(next: TransactionStatus, sideEffects: SideEffect[]): TxnTransition {
  return { ok: true, next, sideEffects };
}

function deny(reason: string): TxnTransition {
  return { ok: false, reason };
}

/**
 * Helper: which roles are allowed to perform a given action? Used by the
 * route handlers to short-circuit unauthorized requests before hitting the
 * state machine.
 */
export function actorRoleAllowed(action: TxnAction["kind"], role: UserRole): boolean {
  if (action === "moderate-resolve" || action === "moderate-reject")
    return role === "MODERATOR" || role === "ADMIN";
  return role === "USER" || role === "MODERATOR" || role === "ADMIN";
}
