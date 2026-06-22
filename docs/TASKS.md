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
| **1** | TBD | **Identity & Profile** (+ community access) | `User`, `Session` | `/api/auth/*`, `/api/users/*`, `/api/communities/[id]/invite-code`, `/api/communities/join-by-code` | `/(auth)/*`, `/profile/*` | review code của #6 |
| **2** | TBD | **Book Catalog + Community posts** | `Listing`, `ListingPhoto`, `CommunityPost`, `CommunityPostLike` | `/api/listings/*`, `/api/isbn/lookup`, `/api/communities/[id]/posts/*`, `/api/communities/posts/images` | `/listings/*` | review code của #1 |
| **3** | TBD | **Discovery + Community groups** | `Follow`, `FeedItem`, `Community`, `CommunityMembership` | `/api/search`, `/api/feed`, `/api/follow`, `/api/communities` (list/create/[id]/join/leave) | `/`, `/search`, `/explore`, `/communities/*` | review code của #2 |
| **4** | TBD | **Transactions & Notifications** | `Transaction`, `TransactionEvent`, `Rating`, `Notification` | `/api/transactions/*`, `/api/notifications/*` | `/transactions/*`, `/notifications` | review code của #3 |
| **5** | TBD | **Trust, Safety, Admin + Community discussion** | `ReputationEvent`, `Report`, `ModerationAction`, `CommunityPostComment`, `CommunityCommentReaction` | `/api/reputation/*`, `/api/reports/*`, `/api/moderation/*`, `/api/communities/[id]/posts/[postId]/comments/*`, `/api/communities/[id]/{moderators,members}`, `/api/admin/*` | `/profile/[id]` (rep widget), `/moderation`, `/admin` | review code của #4 |
| **6** | TBD | **Artifacts & Messaging** | `ArtifactComment`, `ArtifactCommentLike`, `Conversation`, `Message` | `/api/artifacts/*`, `/api/conversations/*`, `/api/messages/*` | `/artifacts/*`, `/messages/*` | review code của #5 |

> Chuỗi review tạo thành một vòng: **1 → 6 → 5 → 4 → 3 → 2 → 1**. Mọi PR phải có 1 approval từ người review chỉ định + 1 approval bất kỳ.
>
> **Lưu ý tái phân bổ (v2):** module Community cũ của #6 đã được **tách nhỏ thành từng phần** và rải đều cho 5 role khác, mỗi phần về nơi **dùng lại** func sẵn có:
> - **Groups & membership** (`Community`, `CommunityMembership`, join/leave, max-20, points) → **#3** (cùng lõi với feed + social graph).
> - **Posts & likes & bulletins** (`CommunityPost`, `CommunityPostLike`) → **#2** (dùng lại pipeline ảnh + `Post.listingId → Listing`).
> - **Discussion** (`CommunityPostComment`, `CommunityCommentReaction`) → **#5** (đây là nội dung bị kiểm duyệt nhiều nhất, cạnh moderation).
> - **Access** (invite-code, nhóm riêng tư, join-by-code) → **#1** (gating, cạnh auth — phần việc, không phải model riêng).
> - **Community moderation + admin + ops** → **#5**;  **notifications** → **#4**.
>
> #6 đổi sang sở hữu **Artifacts** (văn học tương tác) **+ Messaging** (chat, chuyển từ #4) để cân khối lượng. Model/người sau khi chia: **#1=2, #2=4, #3=4, #4=4, #5=5, #6=4** (#1 ít model nhưng gánh phần nền tảng auth + access; community không có model nào hợp ngữ nghĩa với Identity).

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

**Thêm (từ Community cũ) — access & gating**:
- `inviteCode` / `isPrivate` của `Community`: sinh & xoay mã mời, kiểm soát quyền vào nhóm riêng tư.
- API: `POST /api/communities/[id]/invite-code` (regenerate), `POST /api/communities/join-by-code`.
- Cung cấp helper `assertCanAccessCommunity(user, community)` cho #3 dùng khi render nhóm private. Tái dùng chính `requireUser()` của bạn.

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

**Thêm (từ Community cũ) — bài đăng cộng đồng**:
- Models: `CommunityPost`, `CommunityPostLike`, enums `CommunityPostKind`, `ReactionType`.
- Server: `src/server/communities/posts.ts`.
- API: `GET/POST /api/communities/[id]/posts`, `.../[postId]` (pin / xoá), `.../[postId]/likes` (reaction 7 emoji), `POST /api/communities/posts/images` (upload, route phục vụ `uploads/community-posts/[filename]`).
- Bulletins: nhập bài tin tức (`kind = BULLETIN`) từ nguồn ngoài qua cron (`/api/communities/bulletins/import`) — đăng ký cron phối hợp với #5 (ops).
- Tái dùng: `listings/photos.ts` (Sharp/S3) cho ảnh bài + `CommunityPost.listingId → Listing` để đính kèm sách. Khi đăng bài, emit `community.post_created` để **#3** fan-out vào feed và **#4** notify.
- Lý do giao cho #2: bài đăng là "content + media" giống listing — chung pipeline ảnh, chung khái niệm đính kèm sách.

---

### 👤 Người 3 — Discovery + Community (Search + Feed + Social + Nhóm)

**Mục tiêu**: Người dùng tìm thấy sách + tham gia nhóm. Bao gồm full-text search, filters, personalised feed, follow / unfollow, **và lõi nhóm cộng đồng** (group + membership, nhận từ #6 cũ).

**Sở hữu**:
- Models: `Follow`, `FeedItem`, `Community`, `CommunityMembership`, enums `CommunityScope`, `CommunityRole`.
- Server: `src/server/search/{service.ts, query-parser.ts}`, `src/server/social/follow.ts`, `src/server/feed/{service.ts, fanout.ts}`, `src/server/communities/groups.ts`.
- API routes:
  - `GET  /api/search`                  — q + filters (genre, condition, type, max price, distance, community)
  - `GET  /api/feed`                    — personalised, paginated
  - `POST /api/follow`                  — follow user
  - `DELETE /api/follow/[userId]`       — unfollow
  - `GET  /api/users/[id]/listings`     — public listings of one user
- Pages: `/` (home feed), `/search`, `/explore`, `/communities`, `/communities/[id]` (lắp ghép bài của #2, thảo luận của #5).
- Tests: full-text relevance ordering, filter intersection, fan-out invariants.

**Thêm (từ Community cũ) — nhóm & thành viên**:
- Nhóm: `GET/POST /api/communities` (create enforce **max-20-per-user**), `GET /api/communities/[id]`, `POST .../join`, `POST .../leave`.
- `communityPoints` trên membership (gamification/leaderboard).
- Subscribe `community.post_created` (của #2) để fan-out bài/bulletin vào feed thành viên — tái dùng `feed/fanout.ts`.
- Gọi `assertCanAccessCommunity()` của #1 khi mở nhóm riêng tư.
- Lý do giao cho #3: nhóm là trục để lọc search/feed (filter `community`) + membership ≈ social graph, cùng lõi với follow/feed.

**Phần khó**: chiến lược fan-out cho FeedItem khi #2 publish 1 listing/`CommunityPost`/bulletin — phải write tới N follower/thành viên → cần job nền hoặc trigger DB. Bắt đầu bằng phiên bản đơn giản (write inline) và đo latency, nâng cấp sau nếu chậm.

---

### 👤 Người 4 — Transactions & Notifications

**Mục tiêu**: Logic phức tạp nhất của hệ thống. Đây là điểm khác biệt với "marketplace bình thường" — nên đầu tư test kỹ. Kèm hệ thống **thông báo realtime** (nhận từ #6 cũ) — phần lớn notification phát sinh từ chính các transition giao dịch của bạn.

**Sở hữu**:
- Models: `Transaction`, `TransactionEvent`, `Rating`, `Notification`, enums `TransactionStatus`, `DeliveryMethod`, `NotificationKind`, `NotificationEmailPreference`.
- Server:
  - `src/server/transactions/{service.ts, state-machine.ts, ratings.ts, scheduler.ts}`
  - `src/server/notifications/{service.ts, dispatcher.ts, email.ts, sse.ts}`
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
  - `GET    /api/notifications`                     — my notifications
  - `POST   /api/notifications/[id]/read`
  - `GET    /api/notifications/preferences` · `GET /api/notifications/stream` (SSE)
  - `POST   /api/cron/notification-immediate` · `notification-digest`
- Pages: `/transactions` (dashboard by status), `/transactions/[id]` (detail + nhúng chat của #6), `/notifications`.
- Tests: state machine — exhaustive (every transition + every illegal transition rejected), 14-day reminder + 21-day auto-complete scheduler, multiple-requester waitlist, **dispatcher fan-out** (event.kind → recipients[]).

**Phần khó**: state machine `transactions/state-machine.ts` (xem template `tests/transactions/state-machine.test.ts` đã có sẵn). Phải kích sự kiện cho:
- Rep engine của #5 khi `COMPLETED` / `CANCELLED`
- Listing status của #2 khi `ACCEPTED` / `CANCELLED` / `COMPLETED`
- Notification dispatcher (của chính bạn) khi mọi transition

Dùng pattern **domain events** (`emit("txn.completed", { ... })`); các module khác subscribe — không gọi Prisma của họ trực tiếp.

**Thêm (từ Community cũ) — notification dispatcher**:
- `notifications/dispatcher.ts` subscribe events từ **TẤT CẢ** module và map `event.kind → recipients[]`. Đây là chỗ duy nhất đọc (READ-only) database của các role khác.
- Lý do giao cho #4: nguồn phát thông báo lớn nhất chính là các transition giao dịch của bạn (`txn.*`) → dispatcher ở cạnh nơi sinh event. Hạ tầng SSE dùng chung tách ra `src/server/lib/` để cả notification (#4) và chat (#6) cùng xài.

---

### 👤 Người 5 — Trust, Safety, Admin & Community discussion

**Mục tiêu**: Reputation engine + reporting + moderation. Đây là phần đặc thù phi-thương-mại của BookBridge — điểm nhấn của báo cáo. Kèm **thảo luận cộng đồng (comment + reaction) + kiểm duyệt cộng đồng + admin/ops** (nhận từ #6 cũ) vì tái dùng đúng RBAC & moderation patterns — comment là nội dung bị kiểm duyệt nhiều nhất.

**Sở hữu**:
- Models: `ReputationEvent`, `Report`, `ModerationAction`, `CommunityPostComment`, `CommunityCommentReaction`, enums `ReputationKind`, `ReportTargetType`, `ReportStatus`, `ModerationActionKind` (enum `ReactionType` dùng chung, do #2 khai báo).
- Server: `src/server/reputation/{service.ts, scoring.ts, anti-gaming.ts}`, `src/server/moderation/{service.ts, queue.ts}`, `src/server/communities/comments.ts`, `src/server/admin/{stats.ts, exports.ts}`.
- API routes:
  - `GET    /api/reputation/[userId]`         — score + breakdown by ReputationKind
  - `POST   /api/reports`                     — file a report
  - `GET    /api/reports/mine`                — reports I filed
  - `GET    /api/moderation/queue`            — moderator-only
  - `POST   /api/moderation/[reportId]/act`   — apply ModerationAction
- Pages: widget reputation hiện trên `/profile/[id]` (component `ReputationBadge`), trang `/moderation`, `/admin`.
- Tests: scoring weights (transaction +10, rating +/- by stars, time decay), reciprocal-pair detection (anti-gaming), tier transitions, stats aggregation correctness.

**Phần khó**: thuật toán anti-gaming. Yêu cầu SRS: "Reciprocal-only pairs and zero-unique-counterparty accounts are flagged automatically." → cần query nhóm theo cặp `(userA,userB)` trong các transaction COMPLETED và đánh dấu các tài khoản chỉ giao dịch lẫn nhau.

**Subscribe** vào `txn.completed` / `txn.cancelled` / `rating.created` từ #4 để cộng điểm.

**Thêm (từ Community cũ) — thảo luận + kiểm duyệt nhóm + admin/ops**:
- Thảo luận: `CommunityPostComment` (comment lồng nhau qua `parentId`) + `CommunityCommentReaction` (7 emoji). API `GET/POST /api/communities/[id]/posts/[postId]/comments`, `.../[commentId]` (xoá), `.../[commentId]/reactions`. Comment đính vào `CommunityPost` của #2 (chỉ đọc `postId`, soft link).
- Kiểm duyệt cộng đồng: cấp/thu quyền moderator nhóm, gỡ thành viên, pin/xoá bài, xoá nhóm — tái dùng `ModerationAction` + `requireRole()`. API `/api/communities/[id]/{moderators,members}` (ghi qua service của #3 hoặc qua event).
- Admin: `GET /api/admin/stats` (admin-only), `GET /api/admin/grant-report` (CSV cho nhà tài trợ).
- **Ops/DevOps**: `.github/workflows/ci.yml` + Vercel deploy; kỷ luật migration (ai sửa schema phải tạo migration; cấm `prisma db push` lên branch shared).
- Lý do giao cho #5: kiểm duyệt nhóm = đúng nghiệp vụ moderation; admin/stats chỉ đọc số liệu tổng hợp, gần với dashboard `/moderation` sẵn có.

---

### 👤 Người 6 — Artifacts (văn học tương tác) + Messaging

**Mục tiêu**: Tính năng đặc trưng, khép kín của BookBridge — biến tác phẩm văn học thành trải nghiệm chơi tương tác (mini-game) kèm lớp thảo luận. Hiện có *Tắt đèn / Tức nước vỡ bờ* và *The Alchemist*. Đây là phần tách biệt hoàn toàn, không phụ thuộc dữ liệu module khác → làm song song thoải mái. Kèm **Messaging** (chat realtime gắn với giao dịch) chuyển từ #4 sang để cân khối lượng.

**Sở hữu**:
- Models: `ArtifactComment`, `ArtifactCommentLike`.
- Server: `src/server/artifacts/comments.ts`.
- Lib (phần lõi): `src/lib/artifacts/{registry.ts, game-types.ts, *-story.ts, *-audio.ts}` — game engine, dữ liệu cốt truyện & âm thanh, registry các artifact.
- API routes:
  - `GET  /api/artifacts/[slug]/comments`            — list thảo luận của 1 artifact
  - `POST /api/artifacts/[slug]/comments`            — đăng bình luận
  - `DELETE /api/artifacts/comments/[commentId]`     — xoá bình luận
  - `POST/DELETE /api/artifacts/comments/[commentId]/like` — like / unlike
- Pages: `/artifacts` (danh sách), `/artifacts/the-alchemist`, `/artifacts/tuc-nuoc-vo-bo`.
- Components: `ArtifactGame`, `GameNarration`, `HealthBar`, `GameOverScreen`, `VictoryScreen`, `PanoramaViewer`, `DesertParticles`, `AudioPlayer`, `ArtifactDiscussion`.
- Tests: chuyển trạng thái game (health/thắng/thua), registry resolve đúng slug, comment + like (1 like / user / comment).

**Phần khó (Artifacts)**: game state engine + đồng bộ narration ↔ audio + UI nhập vai (panorama 360°, particle). Phải tách dữ liệu cốt truyện (`*-story.ts`) khỏi logic game (`game-types.ts`) để thêm artifact mới chỉ cần khai báo dữ liệu + đăng ký vào `registry.ts`. Độ phức tạp tương đương phần dispatcher cũ.

**Thêm — Messaging (chat)**:
- Models: `Conversation`, `Message`.
- Server: `src/server/messaging/{service.ts, sse.ts}` (SSE helper dùng chung lấy từ `src/server/lib/`).
- API: `GET /api/conversations`, `GET /api/conversations/[id]/messages`, `POST /api/conversations/[id]/messages`, `GET /api/conversations/[id]/stream` (SSE).
- Pages: `/messages` (inbox), `/messages/[conversationId]`; component chat được #4 nhúng vào `/transactions/[id]`.
- Tests: gửi/nhận tin theo thứ tự, phân quyền chỉ 2 bên trong hội thoại, stream SSE.

**Phần khó (Messaging)**: realtime qua SSE (1 kết nối / tab) + đảm bảo chỉ 2 bên giao dịch đọc được hội thoại. Emit `message.created` để dispatcher của #4 bắn notification.

**Phụ thuộc**: dùng `getCurrentUser()` / `requireUser()` của #1; `Conversation.transactionId` là **soft link** (SetNull) tới `Transaction` của #4 — chỉ đọc id, không ghi vào DB của #4.

---

## Mốc thời gian (8 tuần)

| Tuần | Việc chung | Ai bị block bởi ai? |
|---|---|---|
| 1 | Setup repo, schema agreed, env vars, CI green | — |
| 2 | Mỗi người scaffold module + 1 test pass + 1 API route trả 200 | #2,3,4,5,6 cần `getCurrentUser()` từ #1 trước |
| 3 | MVP per module: tối thiểu CRUD chạy | #4 cần `Listing` của #2 |
| 4 | Tích hợp transition giữa các module qua event bus | #5 (rep) và #4 (notifications) cần events từ txn; #3 (community feed) cần fan-out |
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
| 2. SRS summary + use-cases | 3 | #1 | #3 |
| 3. Architecture & data model | 4 | #3 | #1 |
| 4. Identity & access control | 2 | #1 | #5 |
| 5. Book catalog, discovery & community | 4 | #2 + #3 | — |
| 6. Transactions & notifications (deep dive on state machine) | 4 | #4 | — |
| 7. Trust system (rep + moderation + anti-gaming) + admin | 4 | #5 | — |
| 8. Artifacts (interactive literature) + messaging | 3 | #6 | #4 |
| 9. Testing & DevOps | 2 | #5 | #4 |
| 10. Conclusion & limitations | 2 | cả nhóm | — |
| **Tổng** | **30** | | |

Mỗi người chính làm slide cho phần của mình (4–5 slide). Người phụ chuẩn bị câu trả lời nếu giảng viên hỏi sâu.
