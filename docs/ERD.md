# Entity-Relationship Diagram

ASCII rendering of the 13 entities in `prisma/schema.prisma`. Owners
annotated with the responsible person.

```
                       ┌──────────────────────────────┐
                       │      User      [ #1 ]        │
                       │ id, email, passwordHash,     │
                       │ displayName, role, status,   │
                       │ reputationScore, tier        │
                       └──┬─────┬─────┬─────┬─────────┘
                          │     │     │     │
              ┌───────────┘     │     │     └────────────┐
              │                 │     │                  │
              ▼                 ▼     ▼                  ▼
   ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
   │   Session  [#1]   │  │  Listing   [#2]  │  │ ReputationEvent   [#5]   │
   │                   │  │ owner, title,    │  │ kind, delta, context     │
   └───────────────────┘  │ price (cap), ... │  └──────────────────────────┘
                          └──┬─────────┬─────┘
                             │         │
                             ▼         ▼
              ┌──────────────────┐  ┌──────────────────┐
              │ ListingPhoto[#2] │  │  Transaction[#4] │
              └──────────────────┘  │ status, type,    │
                                    │ price, delivery  │
                                    └──┬─────┬─────┬───┘
                                       │     │     │
                                       ▼     ▼     ▼
                       ┌─────────────────┐ ┌────────────┐ ┌────────────────┐
                       │ TxnEvent  [#4]  │ │ Rating[#4] │ │ Conversation   │
                       │ from->to status │ │ stars,     │ │ [#4] tied to   │
                       │ audit log       │ │ comment    │ │ optional txn   │
                       └─────────────────┘ └────────────┘ └─────┬──────────┘
                                                                │
                                                                ▼
                                                        ┌──────────────┐
                                                        │ Message[#4]  │
                                                        └──────────────┘

   ┌──────────────────┐    ┌────────────────────┐
   │  Follow   [#3]   │    │  FeedItem   [#3]   │
   │ follower-followee│    │ recipient + payload│
   └──────────────────┘    └────────────────────┘

   ┌──────────────────────────────┐    ┌──────────────────────────────┐
   │  Report           [#5]       │    │  ModerationAction   [#5]     │
   │ targetType, status           │────┤ kind, by-mod, on-user        │
   └──────────────────────────────┘    └──────────────────────────────┘

   ┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
   │  Community [#6]  │────┤  Membership   [#6]   │────│  Notification    │
   │ scope, name      │    │ user-community-role  │    │  [#6]            │
   └──────────────────┘    └──────────────────────┘    └──────────────────┘
```

## Cross-module foreign keys (touch points)

| FK | Owner | References | Read / Write by |
|---|---|---|---|
| `Listing.communityId` | #2 | `Community` (#6) | #2 reads; #6 reads to count members |
| `Listing.ownerId` | #2 | `User` (#1) | #2, #4 |
| `Transaction.listingId` | #4 | `Listing` (#2) | #4 |
| `Transaction.ownerId / requesterId` | #4 | `User` (#1) | #4 |
| `Conversation.transactionId` | #4 | `Transaction` (#4) | #4 |
| `Report.targetUserId / Listing / Transaction` | #5 | (multiple) | #5 |
| `ReputationEvent.userId` | #5 | `User` (#1) | #5 writes; #1 reads `User.reputationScore` |
| `Notification.userId` | #6 | `User` (#1) | #6 |

## Indexes (highlights)

* `User.reputationTier` — fast tier-filtered listings on profile pages.
* `Listing.status, Listing.genre, Listing.transactionType` — power the
  search filter combinations.
* `Transaction.status` — drives the user dashboard "by status" tabs.
* `Conversation.userAId / userBId` — inbox lookup.
* `(FeedItem.userId, createdAt)` — paginated feed.

For full index list see the bottom of `prisma/schema.prisma`.
