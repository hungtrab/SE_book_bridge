# SRS Summary — BookBridge v1.0

Condensed from `SE/SRS_Zootopia.docx` and the SRS slide deck. Use the full
document for any contractual question; this summary is for daily reference.

## Vision

> A trust-driven online community where book lovers gift, exchange, or
> sell pre-owned books at symbolic prices — keeping books in circulation
> and out of landfills.

Aligned with **UN SDG 4** (Quality Education) and **SDG 12** (Responsible
Consumption).

## Scope (what we are / are not)

| ✅ We are | ❌ We are not |
|---|---|
| Web-based, mobile-responsive | A commercial marketplace |
| Non-profit, grant-funded | A payment processor |
| Coordination tool for user-to-user sharing | A shipping / logistics provider |
| Trust-driven community with reputation | A replacement for legal enforcement |

Sale prices are capped (default 50,000 VND) to enforce the non-commercial
mission.

## User classes

| Class | Privileges | Frequency |
|---|---|---|
| Guest | browse + search; no transact / message | occasional |
| Registered User | list / request / share | weekly–daily |
| Community Moderator | curate sub-community; review reports in scope | frequent |
| System Administrator | full admin dashboard, configuration, analytics | daily |

## Functional modules (10 in SRS §4)

| § | Module | Priority | Owner |
|---|---|---|---|
| 4.1 | User Registration & Authentication | High | #1 |
| 4.2 | Book Listing Management | High | #2 |
| 4.3 | Search and Discovery | High | #3 |
| 4.4 | Transaction Workflow | High | #4 |
| 4.5 | Reputation and Trust System | High | #5 |
| 4.6 | Social Connectivity (Follow / Feed / Notifications) | High | #3 (follow/feed) + #6 (notifications) |
| 4.7 | Community and Sub-community Management | Medium | #6 |
| 4.8 | In-app Messaging | Medium | #4 |
| 4.9 | Content Moderation and Reporting | Medium | #5 |
| 4.10 | Administrative Dashboard | Medium | #6 |

## Transaction state machine (§4.4 + slide 6)

```
PENDING ─accept─► ACCEPTED ─ship─► IN_DELIVERY ─complete─► COMPLETED ─rate─► (Rated)
   │                │                  │
 cancel│           cancel│              dispute│
   │                │                  │
   ▼                ▼                  ▼
CANCELLED       CANCELLED          DISPUTED ─moderate─► COMPLETED / CANCELLED
   ▲
   │ decline
   │
PENDING ─decline─► DECLINED

Other:
  • If multiple users request a listing, the owner accepts one and the
    rest are moved to WAITLISTED.
  • System reminder at 14 days IN_DELIVERY; auto-COMPLETE at 21 days.
```

The full state machine lives in
`src/server/transactions/state-machine.ts` and is exhaustively unit-tested.

## Reputation tiers (§4.5 + slide 7)

| Score | Tier label |
|---|---|
| 0–19 | New Member |
| 20–49 | Active Sharer |
| 50–79 | Trusted Contributor |
| 80–100 | Community Champion |

Anti-gaming: reciprocal-only pairs and zero-unique-counterparty accounts
are flagged automatically (see `src/server/reputation/anti-gaming.ts`).

## Non-functional requirements (§5)

| Aspect | Target |
|---|---|
| Initial page load over 4G | < 3 s |
| Search response (95 %) | < 2 s |
| Concurrent users | 1 000+ |
| Monthly uptime | 99.5 % |
| Auth hashing | argon2id (we use Argon2id; bcrypt also OWASP-acceptable) |
| Session | JWT or signed cookies + rate-limited login |
| Accessibility | WCAG 2.1 Level AA |
| Test coverage | ≥ 70 % |
| i18n | Vietnamese + English |
| Location precision | district-level only — no exact coordinates |

## Constraints

- Must comply with VN Cybersecurity Law and (where applicable) GDPR.
- No payment card data ever stored. Money for SELL transactions is
  exchanged out-of-band.
- Deployable on standard cloud infrastructure (no proprietary HW).

## TBDs (open items from SRS Appendix C)

These need a product decision before MVP launch — track in the GitHub
project board:

1. Grant sponsor reporting requirements.
2. ISBN API provider selection (Open Library is the default in `.env.example`).
3. Dispute-resolution SLA & escalation path.
4. WCAG 2.1 AA audit timeline.
5. Sell-payment coordination guidance / disclaimer text.
