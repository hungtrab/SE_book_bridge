# Phân chia công việc — Team Zootopia (6 người)

> Đọc tài liệu này **trước khi** mở PR đầu tiên. Mỗi người sở hữu 1 cụm module độc lập về dữ liệu và API, nên 6 người có thể làm song song mà không đụng nhau. Khi cần liên module, đi qua interface trong `src/server/lib/` (không gọi Prisma trực tiếp ngoài module của mình).

## Nguyên tắc chia việc

1. **Cân bằng khối lượng**: mỗi người có ~3 model Prisma, ~5 API route, ~2 trang UI, ~2 module logic, ~3 file test. Tổng dòng code dao động ±15 %.
2. **Cân bằng độ khó**: mỗi người có 1 phần "khó" (logic phức tạp / yêu cầu suy nghĩ thiết kế) + các phần dễ (CRUD chuẩn). Không ai chỉ làm CRUD và không ai bị nuốt hết phần khó.
3. **Cân bằng kỹ năng**: bất cứ ai cũng phải đụng cả 3 lớp (DB schema → server logic → UI). Không có "người chỉ viết frontend" hay "người chỉ viết DB".
4. **Ranh giới rõ**: mỗi người có 1 thư mục `src/server/<module>/` riêng + 1 nhóm route `src/app/api/<module>/` riêng. PR chỉ chạm thư mục của mình → không conflict.
5. **Ai cũng review được**: cặp review chéo cố định (xem dưới) đảm bảo không có ai một mình kiểm soát một phần.

---

## Bảng tổng quan

| # | Người | Cụm module | Prisma owns | API routes | Pages | Cặp review chéo |
|---|---|---|---|---|---|---|
| **1** | TBD | **Identity & Profile** | `User`, `Session` | `/api/auth/*`, `/api/users/*` | `/(auth)/*`, `/profile/*` | review code của #6 |
| **2** | TBD | **Book Catalog** | `Listing`, `ListingPhoto` | `/api/listings/*`, `/api/isbn/lookup` | `/listings/*` | review code của #1 |
| **3** | TBD | **Discovery** | `Follow`, `FeedItem` | `/api/search`, `/api/feed`, `/api/follow` | `/`, `/search`, `/explore` | review code của #2 |
| **4** | TBD | **Transactions & Messaging** | `Transaction`, `TransactionEvent`, `Rating`, `Conversation`, `Message` | `/api/transactions/*`, `/api/messages/*`, `/api/conversations/*` | `/transactions/*`, `/messages/*` | review code của #3 |
| **5** | TBD | **Trust & Safety** | `ReputationEvent`, `Report`, `ModerationAction` | `/api/reputation/*`, `/api/reports/*`, `/api/moderation/*` | `/profile/[id]` (rep widget), `/moderation` | review code của #4 |
| **6** | TBD | **Community & Ops** | `Community`, `CommunityMembership`, `Notification` | `/api/communities/*`, `/api/notifications/*`, `/api/admin/*` | `/communities/*`, `/admin`, `/notifications` | review code của #5 |

> Chuỗi review tạo thành một vòng: **1 → 6 → 5 → 4 → 3 → 2 → 1**. Mọi PR phải có 1 approval từ người review chỉ định + 1 approval bất kỳ.

---

## Chi tiết từng người

### 👤 Người 1 — Identity & Profile

**Mục tiêu**: Quản lý đăng ký / đăng nhập / profile. Mọi module khác phụ thuộc vào `getCurrentUser()` của bạn.

**Sở hữu**:
- Models: `User`, `Session`, enum `UserRole`, `AccountStatus`.
- Server: `src/server/auth/`, `src/server/users/`, `src/server/lib/auth-context.ts`.
- API routes:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `POST /api/auth/verify-email`
  - `POST /api/auth/reset-password`
  - `GET  /api/users/me`
  - `GET  /api/users/[id]`
  - `PATCH /api/users/me`
- Pages: `/login`, `/register`, `/verify-email`, `/reset-password`, `/profile/[id]`, `/profile/edit`.
- Tests: hashing, session expiry, rate-limited login, profile update validation.

**Phần khó**: thiết kế session với `iron-session` (cookie httpOnly), email verification token TTL 72 h, password reset token TTL 1 h. Phối hợp với #5 để khoá tài khoản khi bị moderation suspend.

**Cung cấp interface (cho người khác dùng)**:
```ts
// src/server/lib/auth-context.ts
export async function getCurrentUser(): Promise<User | null>
export async function requireUser(): Promise<User>
export async function requireRole(role: UserRole): Promise<User>
```

---

### 👤 Người 2 — Book Catalog

**Mục tiêu**: Tạo / sửa / xoá listing, upload ảnh, tích hợp ISBN.

**Sở hữu**:
- Models: `Listing`, `ListingPhoto`, enums `BookCondition`, `TransactionType`, `ListingStatus`.
- Server: `src/server/listings/{service.ts, isbn.ts, validation.ts, photos.ts}`.
- API routes:
  - `GET  /api/listings`               — list (pagination + basic filters)
  - `POST /api/listings`               — create (validate price cap)
  - `GET  /api/listings/[id]`          — detail
  - `PATCH /api/listings/[id]`         — edit (block khi có txn đang accepted)
  - `DELETE /api/listings/[id]`        — soft delete
  - `GET  /api/isbn/lookup?isbn=...`   — Open Library proxy
- Pages: `/listings` (browse), `/listings/new`, `/listings/[id]`, `/listings/[id]/edit`.
- Tests: ISBN auto-fill, price-cap enforcement, edit block when accepted.

**Phần khó**: state machine của `ListingStatus` (ACTIVE ↔ RESERVED ↔ COMPLETED) phối hợp với #4 — khi #4 accept transaction phải gọi `markReserved(listingId)` của bạn, khi cancel thì `markActive(listingId)`.

---

### 👤 Người 3 — Discovery (Search + Feed + Social graph)

**Mục tiêu**: Người dùng tìm thấy sách. Bao gồm full-text search, filters, personalised feed, follow / unfollow.

**Sở hữu**:
- Models: `Follow`, `FeedItem`.
- Server: `src/server/search/{service.ts, query-parser.ts}`, `src/server/social/follow.ts`, `src/server/feed/{service.ts, fanout.ts}`.
- API routes:
  - `GET  /api/search`                  — q + filters (genre, condition, type, max price, distance, community)
  - `GET  /api/feed`                    — personalised, paginated
  - `POST /api/follow`                  — follow user
  - `DELETE /api/follow/[userId]`       — unfollow
  - `GET  /api/users/[id]/listings`     — public listings of one user
- Pages: `/` (home feed), `/search`, `/explore`.
- Tests: full-text relevance ordering, filter intersection, fan-out invariants.

**Phần khó**: chiến lược fan-out cho FeedItem khi #2 publish 1 listing — phải write tới N follower → cần job nền hoặc trigger DB. Bắt đầu bằng phiên bản đơn giản (write inline) và đo latency, nâng cấp sau nếu chậm.

---

### 👤 Người 4 — Transactions & Messaging

**Mục tiêu**: Logic phức tạp nhất của hệ thống. Đây là điểm khác biệt với "marketplace bình thường" — nên đầu tư test kỹ.

**Sở hữu**:
- Models: `Transaction`, `TransactionEvent`, `Rating`, `Conversation`, `Message`, enums `TransactionStatus`, `DeliveryMethod`.
- Server:
  - `src/server/transactions/{service.ts, state-machine.ts, ratings.ts, scheduler.ts}`
  - `src/server/messaging/{service.ts, sse.ts}`
- API routes:
  - `POST   /api/transactions`                       — request a book
  - `GET    /api/transactions`                       — my transactions
  - `GET    /api/transactions/[id]`
  - `POST   /api/transactions/[id]/accept`
  - `POST   /api/transactions/[id]/decline`
  - `POST   /api/transactions/[id]/cancel`
  - `POST   /api/transactions/[id]/ship`
  - `POST   /api/transactions/[id]/complete`
  - `POST   /api/transactions/[id]/dispute`
  - `POST   /api/transactions/[id]/rate`
  - `GET    /api/conversations`
  - `GET    /api/conversations/[id]/messages`
  - `POST   /api/conversations/[id]/messages`
  - `GET    /api/conversations/[id]/stream`         — SSE
- Pages: `/transactions` (dashboard by status), `/transactions/[id]` (detail + chat embed), `/messages` (inbox), `/messages/[conversationId]`.
- Tests: state machine — exhaustive (every transition + every illegal transition rejected), 14-day reminder + 21-day auto-complete scheduler, multiple-requester waitlist.

**Phần khó**: state machine `transactions/state-machine.ts` (xem template `tests/transactions/state-machine.test.ts` đã có sẵn). Phải kích sự kiện cho:
- Rep engine của #5 khi `COMPLETED` / `CANCELLED`
- Listing status của #2 khi `ACCEPTED` / `CANCELLED` / `COMPLETED`
- Notifications của #6 khi mọi transition

Dùng pattern **domain events** (`emit("txn.completed", { ... })`); các module khác subscribe — không gọi Prisma của họ trực tiếp.

---

### 👤 Người 5 — Trust & Safety

**Mục tiêu**: Reputation engine + reporting + moderation. Đây là phần đặc thù phi-thương-mại của BookBridge — điểm nhấn của báo cáo.

**Sở hữu**:
- Models: `ReputationEvent`, `Report`, `ModerationAction`, enums `ReputationKind`, `ReportTargetType`, `ReportStatus`, `ModerationActionKind`.
- Server: `src/server/reputation/{service.ts, scoring.ts, anti-gaming.ts}`, `src/server/moderation/{service.ts, queue.ts}`.
- API routes:
  - `GET    /api/reputation/[userId]`         — score + breakdown by ReputationKind
  - `POST   /api/reports`                     — file a report
  - `GET    /api/reports/mine`                — reports I filed
  - `GET    /api/moderation/queue`            — moderator-only
  - `POST   /api/moderation/[reportId]/act`   — apply ModerationAction
- Pages: widget reputation hiện trên `/profile/[id]` (component `ReputationBadge`), trang `/moderation`.
- Tests: scoring weights (transaction +10, rating +/- by stars, time decay), reciprocal-pair detection (anti-gaming), tier transitions.

**Phần khó**: thuật toán anti-gaming. Yêu cầu SRS: "Reciprocal-only pairs and zero-unique-counterparty accounts are flagged automatically." → cần query nhóm theo cặp `(userA,userB)` trong các transaction COMPLETED và đánh dấu các tài khoản chỉ giao dịch lẫn nhau.

**Subscribe** vào `txn.completed` / `txn.cancelled` / `rating.created` từ #4 để cộng điểm.

---

### 👤 Người 6 — Community + Notifications + Admin + Ops

**Mục tiêu**: Phần "ngoại biên" nhưng cross-cutting. Bạn là người chạm tới mọi module qua hệ thống thông báo. Cũng là người làm DevOps.

**Sở hữu**:
- Models: `Community`, `CommunityMembership`, `Notification`, enums `CommunityScope`, `CommunityRole`, `NotificationKind`.
- Server: `src/server/communities/service.ts`, `src/server/notifications/{service.ts, dispatcher.ts}`, `src/server/admin/{stats.ts, exports.ts}`.
- API routes:
  - `GET    /api/communities`              — search / list
  - `POST   /api/communities`              — create (max-20-per-user enforced)
  - `GET    /api/communities/[id]`
  - `POST   /api/communities/[id]/join`
  - `POST   /api/communities/[id]/leave`
  - `GET    /api/notifications`
  - `POST   /api/notifications/[id]/read`
  - `GET    /api/admin/stats`              — admin-only
  - `GET    /api/admin/grant-report`       — CSV export for grant sponsors
- Pages: `/communities`, `/communities/[id]`, `/notifications`, `/admin`.
- Tests: max-20 communities per user, dispatcher fan-out, stats aggregation correctness.

**Phần khó**: notification dispatcher — phải subscribe events từ TẤT CẢ các module khác và quyết định ai cần biết gì. Dùng pattern map (`event.kind -> recipients[]`). Đây là chỗ duy nhất chạm tới database của 5 người còn lại (chỉ READ).

**Ops**:
- `.github/workflows/ci.yml` and Vercel configuration for production deploy.
- Migration discipline: ai sửa schema phải tạo migration; không ai được `prisma db push` lên branch shared.

---

## Mốc thời gian (8 tuần)

| Tuần | Việc chung | Ai bị block bởi ai? |
|---|---|---|
| 1 | Setup repo, schema agreed, env vars, CI green | — |
| 2 | Mỗi người scaffold module + 1 test pass + 1 API route trả 200 | #2,3,4,5,6 cần `getCurrentUser()` từ #1 trước |
| 3 | MVP per module: tối thiểu CRUD chạy | #4 cần `Listing` của #2 |
| 4 | Tích hợp transition giữa các module qua event bus | #5 và #6 cần events từ #4 |
| 5 | UI flows: register → list → request → chat → rate | tất cả hợp nhất |
| 6 | Test E2E (Playwright) cho 3 flow chính + bug fixing | — |
| 7 | Polishing: a11y, i18n VI/EN, performance | — |
| 8 | Demo dry-run, slide, báo cáo | — |

---

## Định nghĩa "DONE" cho 1 module

1. ✅ Migration đã merge.
2. ✅ Tất cả API route trả lỗi đúng status code (400/401/403/404/409 phù hợp).
3. ✅ Có ≥ 1 test cho mỗi happy path + ≥ 1 test cho mỗi failure path quan trọng.
4. ✅ Trang UI render đúng cho rỗng / loading / lỗi / có data.
5. ✅ Đã được review chéo bởi người trong vòng review.
6. ✅ TypeScript `tsc --noEmit` xanh, ESLint xanh.

---

## Báo cáo cuối kỳ — phân chia chương

| Chương | Trang | Người chính | Người phụ |
|---|---|---|---|
| 1. Introduction & motivation | 2 | cả nhóm | — |
| 2. SRS summary + use-cases | 3 | #1 | #6 |
| 3. Architecture & data model | 4 | #6 | #1 |
| 4. Identity & access control | 2 | #1 | #5 |
| 5. Book catalog & discovery | 3 | #2 + #3 | — |
| 6. Transactions & messaging (deep dive on state machine) | 5 | #4 | — |
| 7. Trust system (rep + moderation + anti-gaming) | 4 | #5 | — |
| 8. Community, notifications, admin | 3 | #6 | — |
| 9. Testing & DevOps | 2 | #6 | #4 |
| 10. Conclusion & limitations | 2 | cả nhóm | — |
| **Tổng** | **30** | | |

Mỗi người chính làm slide cho phần của mình (4–5 slide). Người phụ chuẩn bị câu trả lời nếu giảng viên hỏi sâu.
