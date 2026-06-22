# Phân vai chi tiết — Team Zootopia (6 người)

> File này là **playbook cá nhân** cho từng thành viên: bạn đọc phần codebase nào, giải quyết yêu cầu nào của khách hàng (ánh xạ rõ tới SRS), và phải nghiên cứu / chuẩn bị những gì.
>
> Khác `TASKS.md` (chia việc theo module), file này tập trung vào **người**: mỗi mục là một role, đọc xong là biết phải làm gì cả kỳ.
>
> Đọc theo thứ tự:
> 1. Phần "Common ground" — đọc chung trước.
> 2. Phần của bạn (Người 1 → Người 6).
> 3. "Integration points" cuối file — biết bạn phụ thuộc / được phụ thuộc bởi ai.

---

## Common ground — mọi người đọc trước

### Tài liệu khách hàng (SRS)

| File | Đọc | Quan trọng vì |
|---|---|---|
| `SE/SRS_Zootopia.docx` | toàn bộ | nguồn gốc của *mọi* yêu cầu. Mọi tranh cãi tham chiếu file này. |
| `docs/SRS_summary.md` | toàn bộ | bản rút gọn 1 trang để tham chiếu nhanh |
| `SE/BookBridge_SRS_Presentation.pptx` | slide 1–10 | client-facing version; câu chuyện bán hàng + mission |

### Codebase tổng quan

| File | Đọc | Mục đích |
|---|---|---|
| `README.md` | toàn bộ | bối cảnh + quick-start |
| `docs/ARCHITECTURE.md` | toàn bộ | sơ đồ layer, domain events, layering rules |
| `docs/ERD.md` | toàn bộ | sơ đồ 13 entity + cross-module FK |
| `docs/API.md` | phần của mình | hợp đồng REST |
| `prisma/schema.prisma` | toàn bộ | source of truth cho data model |
| `docs/TASKS.md` | phần của mình | trách nhiệm code |

### Tech stack — phải biết cơ bản

Mọi người **học trong tuần 1** trước khi viết code. Liên kết tham khảo:

| Công nghệ | Tài liệu chính | Thời gian học |
|---|---|---|
| **Next.js 14 App Router** | https://nextjs.org/docs/app | 4 h — đọc Routing, Server/Client Components, Route Handlers |
| **Prisma** | https://www.prisma.io/docs/orm/prisma-client | 2 h — CRUD + relations |
| **TypeScript** | đã quen → bỏ qua; chưa → https://www.typescriptlang.org/docs/handbook/2/basic-types.html | 3 h |
| **Zod** | https://zod.dev | 1 h — chỉ cần `z.object`, `safeParse`, `infer` |
| **Tailwind CSS** | https://tailwindcss.com/docs/utility-first | 1 h — cú pháp utility |
| **Vitest** | https://vitest.dev/guide/ | 30 phút |

### Quy tắc làm việc

- **Branch**: `feat/<role>/<short-desc>` (vd `feat/auth/email-verify`).
- **PR**: 1 PR / 1 chức năng nhỏ. Đính kèm screenshot UI nếu chạm UI.
- **Review**: 1 approval từ người review trong vòng (xem `TASKS.md`) + 1 approval bất kỳ.
- **Test**: PR phải `npm test` xanh + có ≥ 1 test cho code mới.
- **Conflict**: nếu PR của bạn cần đổi schema Prisma → bắt buộc tag #5 (DevOps lead).

---

## Mức độ "căng" của 6 vai — xếp từ nặng đến nhẹ

> Đọc bảng này khi nhóm phân vai để tránh ai đó bị quá tải / nhàn rỗi. "Căng" tính theo: độ phức tạp logic + số lượng module phụ thuộc + lượng nghiên cứu trước khi viết code + khả năng debug khi sai.

| Hạng | Vai | Độ căng | Lý do |
|---|---|---|---|
| 🥇 1 | **#4 Transactions & Notifications** | 🔥🔥🔥🔥🔥 | State machine 8 trạng thái + 12 transitions, scheduler cron 14d/21d, side-effects vào 3 module khác. Kèm **notification dispatcher** subscribe events từ TẤT CẢ module + email digest. Sai 1 transition → cả flow giao dịch hỏng. |
| 🥈 2 | **#5 Trust, Safety, Admin & Community discussion** | 🔥🔥🔥🔥 | Reputation algorithm (đọc paper academic), anti-gaming math (graph algorithm), moderation queue. Kèm **thảo luận cộng đồng** (comment/reaction) + **kiểm duyệt nhóm** + **admin dashboard + DevOps/CI** cho cả nhóm. Là "điểm nhấn báo cáo". |
| 🥉 3 | **#3 Discovery + Community groups** | 🔥🔥🔥🔥 | PostgreSQL full-text search + GIN index + fan-out strategy (write vs read). Kèm **lõi nhóm cộng đồng** (group + membership + fan-out bài/bulletin vào feed). 4 model, nhiều route. |
| 4 | **#6 Artifacts + Messaging** | 🔥🔥🔥 | **Artifacts**: game state engine + đồng bộ narration↔audio + UI nhập vai (canvas/panorama/particle) — heavy frontend. **Messaging**: chat realtime qua SSE. Khép kín, ít phụ thuộc DB module khác → debug độc lập. |
| 5 | **#2 Book Catalog + Community posts** | 🔥🔥🔥 | CRUD + ISBN external API + image upload. Kèm **bài đăng cộng đồng** (post + like + bulletin) dùng lại pipeline ảnh. Phần khó: phối hợp listing-status với #4 + fan-out post cho #3. |
| 6 | **#1 Identity & Profile** | 🔥🔥 | Auth là pattern well-known: Argon2id + iron-session + email verify token. 2 model. Kèm slice **community access** (invite/private/join-by-code). Thấp novelty nhưng **CRITICAL** vì 5 người khác phụ thuộc — không được delay. |

### Cân bằng thực tế

* Hạng 1–3 (#4, #5, #3) là **khó hơn rõ rệt** — nên giao cho người làm web nhiều / muốn học đào sâu / có khả năng tự đọc paper.
* Hạng 4–6 (#6, #2, #1) là **dễ hơn nhưng quan trọng** — phù hợp với người mới, hoặc người dùng kỳ này để học framework. (#6 heavy về frontend game nhưng độc lập, hợp người thích UI/animation.)
* **Cảnh báo**: đừng để người yếu nhất nhận #4. Sai state machine → demo fail trên sân khấu.

### Khi nhóm thiếu người mạnh

Nếu chỉ có 1–2 người dày dạn web dev, ưu tiên xếp họ vào:
1. **#4** (must-have): nếu ai đó từng làm app có flow phức tạp (booking / e-commerce checkout) → #4
2. **#5** (DevOps + research): ai từng deploy production / setup CI → #5 (vai này nay gánh DevOps cho cả nhóm)
3. **#3** sau cùng — full-text search + fan-out cần tư duy kiến trúc; người đọc tốt làm được nếu có thời gian

---

## 👤 Người 1 — Identity & Profile (Auth + User)

### Khách hàng cần gì (SRS mapping)

| SRS section | Yêu cầu chính | Cường độ |
|---|---|---|
| **§ 4.1 User Registration & Authentication** | đăng ký bằng email, verification, login, password reset, profile editing | High — module bắt buộc của MVP |
| § 5.3 Security Requirements | bcrypt/Argon2 hashing, JWT/cookie session, rate-limited login, OWASP-aligned input sanitisation | High |
| § 2.3 User Classes | phân biệt Guest / Registered User / Moderator / Admin | High |

**Yêu cầu chi tiết bạn chịu trách nhiệm** (REQ-IDs):

- `REQ-UM-001` Đăng ký email + password (8+ ký tự, có hoa/thường/số)
- `REQ-UM-002` Email verification trong 72h
- `REQ-UM-003` Password reset token TTL 1h
- `REQ-UM-004` User edit display name, avatar, bio, preferred genres, location
- `REQ-UM-005` User delete account (anonymise transaction history)
- `REQ-UM-006` Session timeout 30 phút inactive + multi-device support
- `REQ-COM-ACCESS` (từ Community cũ) Mã mời + nhóm riêng tư: regenerate invite code, join-by-code, gate quyền vào nhóm `isPrivate`

### Code bạn sở hữu

```
src/server/auth/                  # service.ts (đăng ký, login, password change), token.ts (verification + reset tokens), session.ts (cookie handling)
src/server/users/                 # service.ts (CRUD profile)
src/server/communities/access.ts  # (từ Community cũ) invite code + private gating; export assertCanAccessCommunity()
src/server/lib/auth-context.ts    # ⚠️ INTERFACE PUBLIC — 5 người khác đều dùng

src/app/api/auth/{register,login,logout,verify-email,reset-password}/route.ts
src/app/api/users/me/route.ts
src/app/api/users/[id]/route.ts
src/app/api/communities/[id]/invite-code/route.ts     # (từ Community cũ) regenerate
src/app/api/communities/join-by-code/route.ts         # (từ Community cũ) join bằng mã

src/app/(auth)/{login,register,verify-email,reset-password}/page.tsx
src/app/profile/{[id],edit}/page.tsx

prisma/schema.prisma  → models User, Session; enums UserRole, AccountStatus
                        (invite-code/private là FIELD trên Community của #3 — bạn chỉ đọc/ghi 2 cột này)
tests/auth.test.ts (chưa có — bạn viết)
tests/users.test.ts (chưa có — bạn viết)
```

> **Lưu ý (tái phân bổ v2)**: community không có model nào hợp với Identity, nên bạn chỉ nhận phần *access-control* (field-level + 2 route), không sở hữu entity community. Đây là phần việc nhỏ thêm vào, cân với việc bạn ít model nhất.

### Đọc / nghiên cứu

| Topic | Tài liệu | Thời gian |
|---|---|---|
| Argon2id vs bcrypt | https://github.com/P-H-C/phc-winner-argon2 + OWASP Password Storage Cheat Sheet | 1 h |
| iron-session API | https://github.com/vvo/iron-session | 1 h |
| OWASP rate limiting | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html | 1 h |
| NextAuth credentials provider (làm reference, không bắt buộc dùng) | https://next-auth.js.org/configuration/providers/credentials | 30 phút |
| Email verification flow patterns | https://supertokens.com/blog/email-verification — bài blog ngắn | 30 phút |

### Việc theo tuần (8 tuần)

| Tuần | Việc |
|---|---|
| 1 | Đọc Common ground + tài liệu Argon2 + iron-session. Setup repo local, chạy `npm run dev`. |
| 2 | Implement `register`, `login`, `logout`. Test: `tests/auth.test.ts` pass với 3 happy paths. |
| 3 | Implement email verification (token TTL 72h) + password reset (token TTL 1h). SMTP có thể dùng ethereal.email cho dev. |
| 4 | Implement profile pages (`/profile/[id]`, `/profile/edit`). UI dùng Tailwind + form Zod-validated. |
| 5 | Phối hợp #5: khi Moderation suspend user → `User.status = SUSPENDED`, login phải fail với message rõ. Phối hợp #6: hiển thị reputation tier trong NavBar. |
| 6 | Rate-limit login (5 lần / 15 phút / IP). Add multi-device session list (`/profile/sessions`). |
| 7 | Bug fixing + e2e test với Playwright cho register → verify → login → edit profile flow. |
| 8 | Báo cáo + slide phần Auth (3 slide). |

### Câu hỏi nghiên cứu (giảng viên có thể hỏi)

1. **Tại sao chọn Argon2id thay vì bcrypt?** → Argon2id thắng PHC 2015, kháng cả side-channel + GPU attack. Bcrypt vẫn OWASP-acceptable nhưng kém hơn về memory-hardness.
2. **Cookie `httpOnly` + `sameSite=lax` đủ chống CSRF chưa?** → Đủ cho 95% case; với mutation cross-origin nguy hiểm dùng thêm CSRF token (chưa cần MVP vì cùng origin).
3. **Tại sao session 30 phút mà refresh token không có?** → Yêu cầu SRS-006 chỉ cần session timeout. iron-session lưu user.id trong cookie encrypted; không cần refresh token vì cookie tự sliding khi user active.
4. **Email verification fail thì sao?** → Account ở `PENDING_VERIFICATION`, login bị reject; có thể request resend. Sau 72h chưa verify → hard-delete (cron job của #6).
5. **Constant-time login check?** → Đã implement: chạy `argon2.verify` với dummy hash khi user not found để timing đồng nhất (xem `auth/service.ts`).

### Demo prep — chuẩn bị 3 phút trình bày

1. Show schema `User` + `Session` (ERD).
2. Live demo: register → email Mailtrap → verify → login → edit profile → logout.
3. Show test pass: `npm test tests/auth.test.ts`.
4. Trả lời câu hỏi nghiên cứu trên.

### Bạn cung cấp gì cho 5 người còn lại

```typescript
// src/server/lib/auth-context.ts — interface ổn định, đừng đổi signature
export async function getCurrentUser(): Promise<User | null>
export async function requireUser(): Promise<User>
export async function requireRole(...roles: UserRole[]): Promise<User>
```

Mọi người khác sẽ gọi 3 hàm này. **Không được đổi signature** sau tuần 2 vì sẽ break code của 5 người. Nếu cần thay đổi → tag tất cả + meeting.

### Đọc thêm — đào sâu / case studies

> Reading list 1 (ở trên) là docs *bắt buộc* để viết code. Phần này là *nâng cao* — đọc khi rảnh để có background trả lời câu hỏi giảng viên hoặc viết phần "related work" trong báo cáo.

| Topic | Tài liệu | Tại sao đáng đọc |
|---|---|---|
| **NIST SP 800-63B Digital Identity Guidelines** | https://pages.nist.gov/800-63-3/sp800-63b.html | Tiêu chuẩn chính phủ Mỹ về password / authenticator. Cite vào báo cáo cho legitimacy. |
| **OAuth 2.0 in Action** (Manning, sách) | chapter 1–3 đủ | Hiểu landscape — vì sao chúng ta KHÔNG dùng OAuth (single-app, không federated) |
| **Auth0 blog — "How Secure Are Your Cookies?"** | https://auth0.com/blog/cookies-vs-tokens-definitive-guide/ | So sánh cookie vs JWT, lý giải lựa chọn iron-session |
| **Rate limiting algorithms** | https://blog.cloudflare.com/counting-things-a-lot-of-different-things/ | Token bucket vs sliding window — chọn cái nào cho /login |
| **Real attack: credential stuffing** | https://owasp.org/www-community/attacks/Credential_stuffing | Hiểu vì sao rate-limit + password complexity quan trọng |
| **UX of password rules** | https://www.nngroup.com/articles/password-creation/ (Nielsen Norman) | Tránh quy tắc mật khẩu phản tác dụng (force change every 90 days) |
| **Have I Been Pwned API** | https://haveibeenpwned.com/API/v3 | Idea cải tiến: check user password trong leaked DB → reject |

**Khi nào nên đọc**: tuần 3–4, sau khi xong basic flow. Chuẩn bị cho phần báo cáo "Security considerations" (1 trang).


---

## 👤 Người 2 — Book Catalog (Listings) + Community posts

### Khách hàng cần gì (SRS mapping)

| SRS section | Yêu cầu chính | Cường độ |
|---|---|---|
| **§ 4.2 Book Listing Management** | tạo / sửa / xoá listing với title, author, ISBN, condition, photos, type (gift/exchange/sell) | High — module bắt buộc của MVP |
| § 5.5 Business Rules | giá bán capped 50,000 VND (chống thương-mại-hoá) | High |
| § 3.3 Software Interfaces — ISBN Lookup | Open Library / Google Books API auto-fill metadata | Medium |
| **§ 4.7 Community (posts)** *(từ Community cũ)* | bài đăng trong nhóm + like/reaction + đính kèm listing; nhập bản tin (bulletin) | Medium |
| § 4.10 Admin Dashboard (1 phần) | listing analytics — bạn cung cấp data | Low |

**Yêu cầu chi tiết bạn chịu trách nhiệm** (REQ-IDs):

- `REQ-BK-001` Tạo listing với 9 trường (title, author, ISBN, genre, condition, description 20-2000 chars, 1-5 photos ≤5MB, type, price)
- `REQ-BK-002` ISBN auto-fill từ Open Library API
- `REQ-BK-003` Reject sell listing nếu price > cap (default 50,000 VND, configurable qua env)
- `REQ-BK-004` Edit listing — block khi có transaction Accepted/In-Delivery
- `REQ-BK-005` Mark Unavailable hoặc delete — cancel pending requests
- `REQ-BK-006` Hiển thị timestamp + reputation tier của owner
- `REQ-COM-POST` *(từ Community cũ)* Bài đăng cộng đồng: create/pin/xoá, like 7-emoji, đính kèm listing (`Post.listingId`), nhập bulletin từ nguồn ngoài; dùng lại pipeline ảnh của listing

### Code bạn sở hữu

```
src/server/listings/service.ts          # CRUD + price-cap guard + edit-block guard
src/server/listings/isbn.ts             # Open Library proxy
src/server/listings/photos.ts           # upload to local/S3 — export uploadImage() dùng chung cho post của bạn
src/server/listings/validation.ts       # Zod schemas
src/server/communities/posts.ts         # (từ Community cũ) post CRUD + like + bulletin import

src/app/api/listings/route.ts                    # GET list, POST create
src/app/api/listings/[id]/route.ts               # GET, PATCH, DELETE
src/app/api/isbn/lookup/route.ts                 # ISBN proxy
src/app/api/communities/[id]/posts/**/route.ts   # (từ Community cũ) posts + [postId] + likes
src/app/api/communities/posts/images/route.ts    # (từ Community cũ) upload ảnh bài
src/app/api/communities/bulletins/import/route.ts # (từ Community cũ) nhập bản tin (cron của #5 gọi)

src/app/listings/page.tsx                        # browse (server component)
src/app/listings/new/page.tsx                    # create form (client component)
src/app/listings/[id]/page.tsx                   # detail
src/app/listings/[id]/edit/page.tsx              # edit form
(component PostForm/BulletinFeed — nhúng vào trang /communities/[id] của #3)

prisma/schema.prisma  → models Listing, ListingPhoto, CommunityPost, CommunityPostLike
                        enums BookCondition, TransactionType, ListingStatus, CommunityPostKind, ReactionType
tests/listings.test.ts, tests/community-posts.test.ts
```

### Đọc / nghiên cứu

| Topic | Tài liệu | Thời gian |
|---|---|---|
| Open Library API | https://openlibrary.org/dev/docs/api/books | 30 phút |
| Next.js Image upload patterns | https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations | 1 h |
| Multipart form-data trong Next.js Route Handlers | https://nextjs.org/docs/app/api-reference/file-conventions/route#convention | 30 phút |
| Image optimisation (Sharp) | https://sharp.pixelplumbing.com — chỉ phần resize | 30 phút |
| S3-compatible storage (Cloudflare R2 free tier) | https://developers.cloudflare.com/r2/api/s3/api/ | 1 h (cho production deploy) |

### Việc theo tuần

| Tuần | Việc |
|---|---|
| 1 | Đọc Common ground + Open Library docs. Vẽ luồng Create Listing trên giấy. |
| 2 | Implement `POST /api/listings` + Zod schema. Test price-cap reject. |
| 3 | Implement ISBN lookup. Form `/listings/new` có nút "Auto-fill từ ISBN" → call API → populate. |
| 4 | Implement upload photo (local filesystem dev, S3 sau). Mỗi listing 1-5 ảnh, validate size + mime. |
| 5 | Implement `GET /api/listings` với pagination cursor + basic filters. Trang `/listings` browse. |
| 6 | Implement Edit + Delete với guard `transaction Accepted` (phối hợp #4 — cần API `getActiveTransactionsForListing`). |
| 7 | Polish UI: empty state, loading state, error toast. E2E test create → edit → delete. |
| 8 | Báo cáo + slide phần Listing (3 slide). |

### Câu hỏi nghiên cứu

1. **Tại sao cap 50,000 VND, không phải 0 (gift only)?** → SRS § 1.4: "symbolic prices to keep books in circulation" — mức nhỏ giúp shipping/giấy tờ, không thương-mại-hoá. Configurable qua env.
2. **Edit listing khi đang có 1 PENDING request thì sao?** → Allowed (transaction chưa accepted). Nếu owner thay đổi `price/condition`, service ghi notification cho requester đang pending trong cùng Prisma transaction.
3. **ISBN không tìm thấy thì sao?** → Form fallback cho user nhập tay. Không reject — không phải sách nào cũng có ISBN (sách cũ, sách Việt).
4. **Tại sao soft-delete (status=REMOVED) thay vì hard delete?** → Giữ audit log; transactions liên quan vẫn cần reference listing để hiển thị history.
5. **Multi-photo upload — sequential vs parallel?** → Parallel với `Promise.all`; mỗi ảnh resize bằng Sharp về max 1024px trước khi lưu S3 để tiết kiệm bandwidth.

### Demo prep

1. Show ERD: Listing + ListingPhoto + cross-FK Community.
2. Live: tạo listing — dán ISBN `978-0-06-093546-7` (Sapiens) → auto-fill → upload 2 ảnh → submit.
3. Try set price 100,000 VND → show 400 error.
4. Edit listing → demo PATCH.
5. Delete → show pending requests get cancelled (phối hợp #4 cho phần này).

### Bạn cần đồng bộ với

- **#4 (Transactions)**: cung cấp method `markReserved(listingId)` / `markActive(listingId)` để #4 gọi khi accept/cancel.
- **#3 (Discovery + Community groups)**: schema `Listing` có index `genre, status, transactionType` mà #3 cần để search. Khi đăng `CommunityPost`/bulletin → emit `community.post_created` để #3 fan-out vào feed thành viên.
- **#4 (Notifications)**: emit `listing.created` và `community.post_created` để #4 dispatch notification cho followers/thành viên.
- **#5 (Community discussion)**: #5 sở hữu comment/reaction *trên bài của bạn* — thống nhất `postId` là khoá; bạn không xoá comment, chỉ xoá post (cascade).

### Đọc thêm — đào sâu / case studies

| Topic | Tài liệu | Tại sao đáng đọc |
|---|---|---|
| **API Design Patterns** (JJ Geewax, Manning) | chương 5 (Standard methods) + chương 7 (Resource layout) | Để tự tin defend kiến trúc REST khi giảng viên hỏi |
| **Roy Fielding's REST thesis** | https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm | Đọc Chapter 5 (10 trang) — REST nguyên gốc, hiểu vì sao "RESTful" hay bị dùng sai |
| **Imgur image upload at scale** | https://medium.com/imgur-engineering — search "image processing" | Case study: pipeline upload → resize → CDN |
| **Cloudflare R2 vs AWS S3 vs local** | https://blog.cloudflare.com/r2-ga/ | So sánh chi phí cho non-profit project (R2 free egress) |
| **Soft-delete patterns** (Vlad Mihalcea blog) | https://vladmihalcea.com/the-best-way-to-soft-delete-with-hibernate/ | Bài về Hibernate nhưng concept áp dụng cho Prisma — pros/cons soft vs hard delete |
| **Open Library data quality issues** | https://github.com/internetarchive/openlibrary/issues — đọc 5 issue gần nhất | Hiểu vì sao auto-fill ISBN không phải lúc nào cũng đúng → cần fallback UX |
| **Marketplace UX research** | https://baymard.com/blog/category/product-listings | Best practices listing card / filter / search — Etsy + Airbnb learnings |
| **ISBN-10 vs ISBN-13 checksum algorithm** | https://en.wikipedia.org/wiki/ISBN — section "ISBN-10 check digit" | Implement client-side validation trước khi gọi API → tiết kiệm rate limit |

**Khi nào nên đọc**: tuần 2–3, trước khi viết ISBN integration. Đặc biệt Open Library issues giúp tránh edge case khi demo.

---

## 👤 Người 3 — Discovery (Search + Feed + Social) + Community groups

### Khách hàng cần gì (SRS mapping)

| SRS section | Yêu cầu chính | Cường độ |
|---|---|---|
| **§ 4.3 Search and Discovery** | full-text search + filters (genre, condition, type, price, distance, community) | High |
| **§ 4.6 Social Connectivity** | follow / unfollow user + personalised feed | High |
| **§ 4.7 Community (groups)** *(từ Community cũ)* | tạo/join/leave nhóm (university/location/genre), max 20/user, community points | Medium |
| § 5.1 Performance | search response < 2 s ở 95% queries | High |

**Yêu cầu chi tiết bạn chịu trách nhiệm** (REQ-IDs):

- `REQ-SD-001` Full-text search trên title, author, ISBN, description (relevance ranking)
- `REQ-SD-002` Filters combinable: genre, condition, type, max price, distance radius, sub-community
- `REQ-SD-003` Search response < 2 s (95% requests, normal load)
- `REQ-SD-004` Personalised feed: listings từ user đã follow + community đã join, sort by recency
- `REQ-SD-005` Related listings trên trang detail (same author / genre / community)
- `REQ-SC-001` Follow / unfollow user (one-directional)
- `REQ-SC-002` New listing từ user follow tự động xuất hiện trong feed real-time
- `REQ-COM-001` *(từ Community cũ)* Tạo community với scope (UNIVERSITY/LOCATION/GENRE)
- `REQ-COM-002` *(từ Community cũ)* Join / leave; max 20 communities / user; community points
- `REQ-COM-FEED` *(từ Community cũ)* Fan-out `CommunityPost`/bulletin (của #2) vào feed thành viên

### Code bạn sở hữu

```
src/server/search/service.ts            # full-text + filter SQL
src/server/search/query-parser.ts       # parse "genre:fiction author:harari"
src/server/social/follow.ts             # follow/unfollow + count maintenance
src/server/feed/service.ts              # paginated feed query
src/server/feed/fanout.ts               # write FeedItem khi listing/post/bulletin publish
src/server/communities/groups.ts        # (từ Community cũ) community + membership CRUD, max-20, points

src/app/api/search/route.ts
src/app/api/feed/route.ts
src/app/api/follow/route.ts                      # POST follow
src/app/api/follow/[userId]/route.ts             # DELETE unfollow
src/app/api/users/[id]/listings/route.ts         # public listings của 1 user
src/app/api/communities/route.ts                 # (từ Community cũ) GET list, POST create (max-20)
src/app/api/communities/[id]/{route,join,leave}/route.ts  # (từ Community cũ) detail, join, leave

src/app/page.tsx                                 # home feed
src/app/search/page.tsx                          # search results
src/app/explore/page.tsx                         # browse by community / genre
src/app/communities/page.tsx                     # (từ Community cũ) danh sách nhóm
src/app/communities/[id]/page.tsx                # (từ Community cũ) trang nhóm — lắp post của #2 + thảo luận của #5

prisma/schema.prisma → models Follow, FeedItem, Community, CommunityMembership; enums CommunityScope, CommunityRole
tests/search.test.ts, tests/feed.test.ts, tests/communities.test.ts  # max-20, join/leave
```

### Đọc / nghiên cứu

| Topic | Tài liệu | Thời gian |
|---|---|---|
| PostgreSQL full-text search (`tsvector`, `to_tsquery`) | https://www.postgresql.org/docs/current/textsearch.html (chương 12) | 2 h |
| Pagination patterns (cursor vs offset) | https://www.prisma.io/docs/orm/prisma-client/queries/pagination | 30 phút |
| Feed fan-out: pull vs push | https://www.michael-noll.com/blog/2013/07/02/twitter-fanout-on-write-vs-fanout-on-read/ | 1 h |
| Trigram similarity (`pg_trgm`) cho fuzzy search | https://www.postgresql.org/docs/current/pgtrgm.html | 30 phút |
| Search query DSL design | https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests | 30 phút |

### Việc theo tuần

| Tuần | Việc |
|---|---|
| 1 | Đọc Common ground + PostgreSQL FTS. Thử `tsvector` trong psql trên seed data. |
| 2 | Implement `GET /api/search` với basic ILIKE filter. Test latency với 1000 listings seed bằng `npm run db:seed:search-benchmark`. |
| 3 | Upgrade lên `tsvector` + GIN index. Migration thêm cột `Listing.search_vector`. |
| 4 | Implement filters combinable (Zod schema cho query params, intersection với AND). Trang `/search` UI có filter sidebar. |
| 5 | Implement `Follow` API + button trong `/profile/[id]`. Phối hợp #1: hiển thị "Followed by 12 people" trong profile header. |
| 6 | Implement Feed fan-out **inline** (write FeedItem khi listing.create). Đo: với 100 followers, tăng latency POST /api/listings bao nhiêu? |
| 7 | Nếu p99 > 500ms → upgrade fan-out qua background queue (Inngest/Trigger.dev hoặc cron + table). E2E test follow → see feed update. |
| 8 | Báo cáo + slide phần Discovery (3 slide). |

### Câu hỏi nghiên cứu

1. **ILIKE vs tsvector — khi nào nên upgrade?** → ILIKE OK đến ~10k rows; tsvector + GIN scale ~100k rows < 50ms. BookBridge dự phóng < 50k listings năm đầu, có thể bắt đầu ILIKE rồi migrate.
2. **Fan-out on write vs read?** → Write: tốt cho user có ít followers (hầu hết người dùng); Read: tốt cho celebrity (hàng nghìn followers). BookBridge không có celebrity → write OK. Nếu phát hiện hot user → switch hybrid.
3. **Filter "distance radius" làm sao khi chỉ có district?** → Mapping district → centroid lat/lng + Haversine distance. SRS yêu cầu district-level only (privacy), không có exact GPS.
4. **Tại sao FeedItem có column `payload Json` thay vì FK rõ ràng?** → Feed có thể chứa nhiều loại event (new_listing, community_announcement, ...); JSON cho phép schema linh hoạt mà không cần Prisma migration mỗi loại event mới.
5. **Search relevance ranking** → tsvector dùng `ts_rank` với weight A (title) > B (author) > C (description). Implement: cột `search_vector tsvector GENERATED ALWAYS AS (...)`.

### Demo prep

1. Chạy `npm run db:seed:search-benchmark` tạo 1000 listings seed → search "harari" → relevance ranking thấy Sapiens trước Homo Deus.
2. Combine filters: genre=non-fiction + condition=GOOD + type=GIFT.
3. Show `EXPLAIN ANALYZE` của query trước/sau khi thêm GIN index — latency 200ms → 5ms.
4. Live: User A follow User B → User B publish listing → User A refresh feed → thấy ngay.
5. Show fan-out latency benchmark.

### Bạn cần đồng bộ với

- **#2 (Listings + Community posts)**: index `(status, genre, transactionType)` cho query của bạn; subscribe `listing.created` + `community.post_created` của #2 để fan-out FeedItem.
- **#1 (Auth + access)**: dùng `requireUser()` cho `/api/feed`; gọi `assertCanAccessCommunity()` của #1 khi mở nhóm riêng tư.
- **#5 (Community discussion)**: trang `/communities/[id]` của bạn nhúng component thảo luận (comment/reaction) do #5 sở hữu.
- **#4 (Notifications)**: khi user A follow B và B publish listing/post, đẩy event để #4 tạo Notification cho A bên cạnh việc bạn viết FeedItem.

### Đọc thêm — đào sâu / case studies

| Topic | Tài liệu | Tại sao đáng đọc |
|---|---|---|
| **Designing Data-Intensive Applications** (Kleppmann) — Chapter 3 | sách (mượn / lib) | "Storage and Retrieval" — hiểu B-tree vs LSM tree vs inverted index. Background cho tsvector. |
| **BM25 ranking** | https://en.wikipedia.org/wiki/Okapi_BM25 + https://www.elastic.co/blog/practical-bm25-part-1-how-shards-affect-relevance-scoring-in-elasticsearch | Hiểu thuật toán đứng sau `ts_rank` — TF-IDF cải tiến |
| **Twitter feed architecture (timeline)** | https://blog.twitter.com/engineering/en_us/topics/infrastructure/2017/the-infrastructure-behind-twitter-scale | Case study fan-out write — Twitter làm hybrid cho celebrity vs normal user |
| **Instagram engineering — feed personalization** | https://instagram-engineering.com/the-evolution-of-the-instagram-search-architecture-7e9e2d31d1f6 | Case study modern feed: ranking + personalization layer |
| **PostgreSQL trigram (`pg_trgm`)** | https://www.postgresql.org/docs/current/pgtrgm.html | Fuzzy search — sửa lỗi gõ sai (typo tolerance). Idea improvement nếu rảnh tuần 8. |
| **Pinterest Pixie graph engine** | https://medium.com/pinterest-engineering/pixie-a-graph-based-recommendation-system-at-pinterest-d9a23dc6f0c | Recommendation algorithms phức tạp hơn — chỉ đọc concept |
| **"Fanout-on-write vs read" — Yao 2013** | http://www.michael-noll.com/blog/2013/07/02/twitter-fanout-on-write-vs-fanout-on-read/ | Bài blog phổ biến đối chiếu 2 chiến lược. Khi nào chọn cái nào. |
| **Cursor pagination vs offset — Slack Engineering** | https://slack.engineering/evolving-api-pagination-at-slack/ | Case study cụ thể: tại sao offset chết khi data lớn |

**Khi nào nên đọc**: tuần 2 (trước FTS implementation) + tuần 6 (trước fan-out optimization). Phần Twitter/Instagram case study là vàng cho slide báo cáo.


---

## 👤 Người 4 — Transactions & Notifications

> ⚠️ Đây là role **phức tạp nhất** trong hệ thống — state machine của transaction là điểm nhấn báo cáo. Bạn cần đầu tư test kỹ hơn các vai khác. Kèm **notification dispatcher** (nhận từ #6 cũ) vì phần lớn thông báo phát sinh từ chính transition giao dịch của bạn.

### Khách hàng cần gì (SRS mapping)

| SRS section | Yêu cầu chính | Cường độ |
|---|---|---|
| **§ 4.4 Transaction Workflow** | state machine 8 trạng thái (Pending → ... → Completed/Cancelled/Disputed) | High — core value của BookBridge |
| **§ 4.6 Notifications** *(từ #6 cũ)* | new listing, txn update, message, community announcement, tier change | High |
| § 4.5 Reputation (1 phần) | bạn emit event `txn.completed` cho #5 cộng điểm | High |
| § 5.1 Performance — notification < 30 s | dispatcher latency target | Medium |

**Yêu cầu chi tiết bạn chịu trách nhiệm** (REQ-IDs):

- `REQ-TX-001` 3 loại: Gift, Exchange (book-for-book), Sell (with cap)
- `REQ-TX-002` State machine với 8 trạng thái — đúng theo § 4.4 của SRS
- `REQ-TX-003` Multiple requesters → queue chronologically; accept 1 → còn lại move to Waitlisted
- `REQ-TX-004` Either party cancel from Pending/Accepted; ghi nhận cancellation cho reputation
- `REQ-TX-005` Delivery method: In-person (map suggestion) hoặc Postal (tracking number)
- `REQ-TX-006` Reminder 14 ngày sau In-Delivery; auto-complete sau 21 ngày nếu không confirm
- `REQ-TX-007` Rating 1-5 stars + optional comment, sau Completed
- `REQ-TX-008` Dispute → Moderator review (#5)
- `REQ-NOT-001` *(từ #6 cũ)* 5 loại notification (new listing from followed, txn status, message, community announcement, tier change)
- `REQ-NOT-002` *(từ #6 cũ)* Real-time push qua SSE; fallback long-polling `GET /api/notifications?wait=1&after=...`
- `REQ-NOT-003` *(từ #6 cũ)* Email digest (immediate / daily / off — user configurable)

### Code bạn sở hữu

```
src/server/transactions/state-machine.ts   # ⭐ pure logic, đã có sẵn + 13 tests pass
src/server/transactions/service.ts          # wire state-machine với Prisma + side-effects
src/server/transactions/scheduler.ts        # 14d reminder + 21d auto-complete cron
src/server/transactions/ratings.ts          # rating CRUD

src/server/notifications/service.ts         # (từ #6 cũ) Notification CRUD
src/server/notifications/dispatcher.ts      # ⭐ (từ #6 cũ) central event router — subscribe TẤT CẢ events #1-#6
src/server/notifications/email.ts           # (từ #6 cũ) email render + SMTP, digest
src/server/notifications/sse.ts             # (từ #6 cũ) SSE push
src/server/lib/events.ts                    # ⭐ (từ #6 cũ) event bus contract (types) — bạn define & lock tuần 2

src/app/api/transactions/route.ts                       # POST request, GET my txns
src/app/api/transactions/[id]/route.ts                  # detail
src/app/api/transactions/[id]/{accept,decline,cancel,ship,complete,dispute,rate}/route.ts
src/app/api/notifications/route.ts                      # (từ #6 cũ) GET mine
src/app/api/notifications/[id]/read/route.ts            # (từ #6 cũ)
src/app/api/notifications/preferences/route.ts          # (từ #6 cũ)
src/app/api/notifications/stream/route.ts               # (từ #6 cũ) SSE
src/app/api/cron/{notification-immediate,notification-digest}/route.ts  # (từ #6 cũ)

src/app/transactions/page.tsx              # dashboard tabbed by status
src/app/transactions/[id]/page.tsx         # detail + nhúng chat (component của #6)
src/app/notifications/page.tsx             # (từ #6 cũ) danh sách thông báo

prisma/schema.prisma → Transaction, TransactionEvent, Rating, Notification; enums TransactionStatus, DeliveryMethod, NotificationKind, NotificationEmailPreference
tests/transactions/state-machine.test.ts  # ✓ đã có, 13 tests pass
tests/transactions/scheduler.test.ts       # bạn viết
tests/notifications.test.ts                # bạn viết — dispatcher fan-out (event.kind → recipients[])
```

> **Messaging đã chuyển sang #6** để cân khối lượng. Bạn vẫn nhúng component chat của #6 vào `/transactions/[id]`; #6 emit `message.created` để dispatcher của bạn bắn notification.

### Đọc / nghiên cứu

| Topic | Tài liệu | Thời gian |
|---|---|---|
| State machine pattern (XState lite, không cần dùng XState) | https://statecharts.dev/concepts.html | 1 h |
| Domain events / event-driven architecture | https://martinfowler.com/eaaDev/DomainEvent.html | 1 h |
| Server-Sent Events trong Next.js | https://vercel.com/docs/functions/streaming/quickstart | 1 h |
| Distributed transaction coordination (saga pattern — chỉ đọc concept) | https://microservices.io/patterns/data/saga.html | 30 phút |
| Cron jobs trên Vercel / Inngest | https://vercel.com/docs/cron-jobs hoặc https://www.inngest.com/docs | 1 h |
| State machine của Stripe payment intent (case study) | https://stripe.com/docs/payments/payment-intents/lifecycle | 30 phút — học cách họ design states |

### Việc theo tuần

| Tuần | Việc |
|---|---|
| 1 | Đọc Common ground + State machine concepts. Vẽ state diagram trên giấy, đối chiếu với `state-machine.ts`. |
| 2 | Hiểu `state-machine.ts` (đã có 13 tests pass). Mở file ra, đọc từng case của `transition()`. Implement `service.ts` apply transition + write side-effects. |
| 3 | API routes cho all 7 actions (accept, decline, cancel, ship, complete, dispute, rate). |
| 4 | UI dashboard `/transactions` tabbed theo status. UI detail `/transactions/[id]` show events timeline. |
| 5 | Define event bus contract `src/server/lib/events.ts` (lock signature, communicate #2/#3/#5/#6). Implement `notifications/dispatcher.ts` — subscribe events, write Notification rows. |
| 6 | SSE `/api/notifications/stream` cho real-time notification + transaction status. Test 2 tab. Email digest (immediate/daily) qua cron. |
| 7 | Scheduler: 14d reminder + 21d auto-complete (cron job hoặc Inngest). Phối hợp #5: emit reputation events. Dispatcher nhận `message.created` từ #6 (chat). |
| 8 | Báo cáo + slide phần Transactions + Notifications (5 slide — bạn nhiều slide nhất vì module phức tạp nhất). |

### Câu hỏi nghiên cứu

1. **Tại sao tách state-machine ra file riêng (pure function), không gộp vào service.ts?** → Test isolation: pure logic test được không cần DB. Hiện 13 tests pass với 0 ms DB time.
2. **Side-effect (notify, listing-status, reputation) — viết trong cùng transaction Prisma hay sau?** → Trong cùng `prisma.$transaction([...])` để atomic: nếu update Transaction fail thì notification cũng không gửi → tránh trạng thái "đã thông báo nhưng giao dịch chưa thật sự đổi state".
3. **Multiple requesters — Pending hay Waitlisted?** → SRS § 4.4 specific: TẤT CẢ pending khi gửi request. Khi owner accept 1 → 1 lên Accepted, các cái khác auto move to Waitlisted (background). Nếu accepted bị cancel → top of waitlist auto promote → Pending.
4. **21-day auto-complete có cần lock optimistic không?** → Có. Cron job đọc list `IN_DELIVERY > 21 days` rồi update status — nếu user vừa complete cùng lúc → conflict. Dùng `prisma.transaction.update({ where: { id, status: 'IN_DELIVERY' } })` — Prisma trả 0 rows nếu user đã complete trước, cron skip.
5. **SSE vs WebSocket cho messaging?** → SSE đơn giản hơn (HTTP-based, auto-reconnect), 1 chiều đủ cho push messages. Client gửi message qua POST bình thường, server push qua SSE. WebSocket overkill cho use case này.
6. **Dispute flow** → User raise dispute → status `DISPUTED` → moderator của #5 reviews trên `/moderation` → chọn `RESOLVE_DISPUTE` (→ Completed) hoặc `REJECT_DISPUTE` (→ Cancelled). Audit trail nằm trong cả `TransactionEvent` và `ModerationAction`.

### Demo prep

1. Show state diagram (1 slide). Đối chiếu với `state-machine.ts` test cases.
2. Live: User A request listing của User B → B accept → A và B chat trong conversation tied to txn → B mark shipped → A confirm received → both rate.
3. Show 14d reminder simulation (manually advance system time hoặc fake `new Date()`).
4. Show illegal transition: try complete from Pending → 400 error.
5. Show audit log: `TransactionEvent` rows từ Pending → Accepted → IN_DELIVERY → Completed.

### Bạn cần đồng bộ với

- **#2 (Listings)**: gọi `markReserved/markActive/markCompleted` trong side-effects.
- **#5 (Reputation)**: emit event `txn.completed` (+10 cả hai), `txn.cancelled` (-3 cancelling party), `rating.created` (+/- by stars).
- **TẤT CẢ module**: bạn sở hữu `events.ts` + dispatcher → mọi người emit event theo contract bạn định nghĩa; bạn quyết định ai nhận notification.
- **#6 (Messaging)**: nhận `message.created` để notify; nhúng component chat của #6 vào trang transaction detail.
- **#1 (Auth)**: dùng `requireUser()` everywhere; `requireRole('ADMIN')` không cần ở đây.

### Đọc thêm — đào sâu / case studies

> Vai bạn là phức tạp nhất — đầu tư đọc nhiều hơn 5 người khác. Phần này dài có chủ đích.

| Topic | Tài liệu | Tại sao đáng đọc |
|---|---|---|
| **Patterns of Enterprise Application Architecture** (Fowler) | chương "Domain Logic Patterns" + "State" | Background cho mọi state machine implementation. Sách cũ nhưng concept vĩnh viễn. |
| **Building Event-Driven Microservices** (Bellemare, O'Reilly) | chapter 1–4 | Đặc biệt phần "Event-First" thinking — design pattern cho domain events |
| **Statecharts (Harel, 1987 paper)** | https://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf | Paper gốc — cite vào báo cáo. Hierarchical states (chưa cần nhưng hay). |
| **XState documentation** | https://stately.ai/docs (chỉ phần "Concepts") | Tham khảo tốt nhất cho state machine trong JS. Không bắt buộc dùng XState — code hiện tại đơn giản hơn nhiều. |
| **Stripe Payment Intent lifecycle** | https://stripe.com/docs/payments/payment-intents/lifecycle | Case study production: 7 trạng thái + idempotency keys. So sánh với BookBridge. |
| **Saga pattern** | https://microservices.io/patterns/data/saga.html | Distributed transactions — chưa cần (single-DB) nhưng câu hỏi giảng viên có thể hỏi. |
| **"How to do distributed locking" — Kleppmann** | https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html | Cần khi cron 21d auto-complete chạy đa-instance. Đọc trước khi deploy production. |
| **Server-Sent Events vs WebSocket** | https://ably.com/blog/websockets-vs-sse | Lý giải vì sao chọn SSE cho messaging |
| **Signal Protocol (overkill nhưng wow)** | https://signal.org/docs/specifications/x3dh/ | Nếu báo cáo có "Future work — E2E encrypted messaging" thì cite cái này |
| **Cron at Google scale (SRE book ch. 24)** | https://sre.google/sre-book/distributed-periodic-scheduling/ | Distributed cron — overkill nhưng cho thấy bạn hiểu khi scale ra. |
| **Idempotency keys (Stripe blog)** | https://stripe.com/blog/idempotency | Nếu user double-click "Accept" — không double-process. Implement đơn giản với unique constraint. |
| **Event sourcing intro** | https://martinfowler.com/eaaDev/EventSourcing.html | Bạn ĐÃ làm event sourcing với `TransactionEvent` table. Đọc để defend kiến trúc. |

**Khi nào nên đọc**: tuần 1 (Fowler + statecharts paper trước khi viết code), tuần 4 (Stripe case study trước khi viết slide), tuần 6 (Kleppmann distributed locking trước khi deploy cron).

---

## 👤 Người 5 — Trust, Safety, Admin & Community discussion

> Module này là **điểm nhấn phi-thương-mại** của BookBridge — phân biệt với Facebook Marketplace. Báo cáo nhấn mạnh phần này. Bạn cũng là **DevOps lead** (CI/CD + deploy + migration discipline) và sở hữu **thảo luận cộng đồng** (comment/reaction — nội dung bị kiểm duyệt nhiều nhất) + **admin dashboard**.

### Khách hàng cần gì (SRS mapping)

| SRS section | Yêu cầu chính | Cường độ |
|---|---|---|
| **§ 4.5 Reputation and Trust System** | score 0-100, 4 tier, anti-gaming detection | High |
| **§ 4.9 Content Moderation and Reporting** | report user/listing/transaction/message; moderator queue + actions | Medium |
| **§ 4.7 Community (discussion + moderation)** *(từ #6 cũ)* | comment lồng nhau + reaction; cấp/thu mod, gỡ thành viên, pin/xoá bài, xoá nhóm | Medium |
| **§ 4.10 Administrative Dashboard** *(từ #6 cũ)* | platform stats, grant reporting CSV | Medium |
| **§ 6 Deployment + Ops** *(từ #6 cũ)* | CI/CD, deploy cloud, migration discipline | High |
| § 5.5 Business Rules | reputation ảnh hưởng đến quyền truy cập (cao = trust badge) | Medium |

**Yêu cầu chi tiết bạn chịu trách nhiệm** (REQ-IDs):

- `REQ-RT-001` Score tính từ ReputationEvent (sum delta); tier theo bảng SRS slide 7
- `REQ-RT-002` Anti-gaming: flag reciprocal-only pair + zero-unique-counterparty users
- `REQ-RT-003` Time decay: -1 điểm / 30 ngày inactive (cron)
- `REQ-RT-004` Visible badge trên profile + listing card
- `REQ-MOD-001` User report listing/user/transaction/message với reason
- `REQ-MOD-002` Moderator queue chỉ có moderator scope-relevant nhìn được
- `REQ-MOD-003` Moderator actions: warn user, remove listing, suspend user, restore
- `REQ-MOD-004` Audit log mọi moderation action (cho compliance / appeal)
- `REQ-COM-DISC` *(từ #6 cũ)* Comment lồng nhau (`parentId`) + reaction 7-emoji trên `CommunityPost` (của #2)
- `REQ-COM-MOD` *(từ #6 cũ)* Cấp/thu community moderator, gỡ thành viên, pin/xoá bài, xoá nhóm (dùng `ModerationAction` + RBAC)
- `REQ-ADM-001` *(từ #6 cũ)* Admin dashboard: active users, transactions completed, books circulated
- `REQ-ADM-002` *(từ #6 cũ)* Grant report CSV export
- `REQ-OPS-001` *(từ #6 cũ)* GitHub Actions CI: lint + test on every PR
- `REQ-OPS-002` *(từ #6 cũ)* Production deploy guide (Vercel + Supabase / Neon)

### Code bạn sở hữu

```
src/server/reputation/scoring.ts        # ⭐ pure logic, đã có + tests pass (16 tests)
src/server/reputation/anti-gaming.ts    # ⭐ pure logic, đã có + tests pass (3 tests)
src/server/reputation/service.ts        # wire với Prisma — bạn viết
src/server/reputation/decay.ts          # cron job time decay

src/server/moderation/service.ts        # report CRUD + moderator actions
src/server/moderation/queue.ts          # filter reports by scope (community moderator)
src/server/communities/comments.ts      # (từ #6 cũ) comment lồng nhau + reaction trên post của #2
src/server/admin/stats.ts               # (từ #6 cũ) aggregations
src/server/admin/exports.ts             # (từ #6 cũ) CSV grant report

src/app/api/reputation/[userId]/route.ts          # GET breakdown
src/app/api/reports/route.ts                       # POST file report
src/app/api/reports/mine/route.ts                  # GET reports tôi đã file
src/app/api/moderation/queue/route.ts              # GET queue (mod-only)
src/app/api/moderation/[reportId]/act/route.ts     # POST moderate action
src/app/api/communities/[id]/posts/[postId]/comments/**/route.ts  # (từ #6 cũ) comment + reaction
src/app/api/communities/[id]/{moderators,members}/route.ts        # (từ #6 cũ) community mod actions
src/app/api/admin/stats/route.ts                   # (từ #6 cũ)
src/app/api/admin/grant-report.csv/route.ts        # (từ #6 cũ)

src/app/profile/[id]/page.tsx       # reputation widget (component)
src/app/moderation/page.tsx         # moderator-only queue UI
src/app/admin/page.tsx              # (từ #6 cũ) admin-only dashboard
src/components/ReputationBadge.tsx
src/components/TierProgressBar.tsx
src/components/communities/CommentSection.tsx   # (từ #6 cũ) nhúng vào trang nhóm của #3

# DevOps (từ #6 cũ — bạn là DevOps lead)
.github/workflows/ci.yml
Vercel project configuration + hosted PostgreSQL
docs/DEPLOYMENT.md, prisma/seed.ts

prisma/schema.prisma → ReputationEvent, Report, ModerationAction, CommunityPostComment, CommunityCommentReaction
                        (enum ReactionType dùng chung — do #2 khai báo)
tests/reputation.test.ts            # ✓ đã có, 16 tests pass
tests/moderation.test.ts, tests/community-comments.test.ts  # bạn viết
```

### Đọc / nghiên cứu

| Topic | Tài liệu | Thời gian |
|---|---|---|
| Reputation systems literature (Resnick & Zeckhauser, eBay paper) | "Reputation Systems" — Comm. ACM 43(12), 2000 | 1 h — đọc abstract + section 3 |
| Anti-gaming patterns (collusion ring detection) | https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/post (Defending Against Sybil Attacks) — đọc abstract | 1 h |
| Stack Overflow reputation rules (case study) | https://stackoverflow.com/help/whats-reputation | 30 phút |
| Discord trust & safety ops | https://discord.com/safety | 30 phút |
| Soft moderation (warn vs ban) — Reddit blog | https://www.reddit.com/r/RedditEng/comments/zlh1lc/automod_a_look_under_the_hood/ | 30 phút |
| Graph algorithms (BFS / connected components — cho reciprocal-only detection) | sách CTCI ch. 4 hoặc Wikipedia | 1 h |

### Việc theo tuần

| Tuần | Việc |
|---|---|
| 1 | Đọc Common ground + reputation papers. Hiểu `scoring.ts` (đã có) — trace từng test case. |
| 2 | Implement `service.ts` — write ReputationEvent + update User.reputationScore atomically. Subscribe to `txn.completed` của #4. |
| 3 | Implement `anti-gaming.ts` integration — chạy weekly cron flag suspicious users (KHÔNG auto-suspend, chỉ flag để mod review). |
| 4 | Implement Report CRUD: user file report → row Pending → mod queue. UI trang `/profile/[id]` có nút "Report". |
| 5 | Moderator queue + ModerationAction implementation. UI `/moderation` (chỉ role MODERATOR). |
| 6 | Time decay cron (-1 / 30 ngày). Test với fake date trong `tests/moderation.test.ts`. |
| 7 | UI: ReputationBadge component dùng trong profile + NavBar + ListingCard (phối hợp #2). Tier progress bar. |
| 8 | Báo cáo + slide phần Trust (4 slide — phần lớn vì là điểm nhấn). |

### Câu hỏi nghiên cứu

1. **Anti-gaming heuristics có false positive như thế nào?** → Reciprocal-only pair: 2 bạn thân thật sự trao đổi nhiều sách lẫn nhau cũng bị flag. Đó là lý do flag không auto-suspend, chỉ vào mod queue.
2. **Tại sao denormalise `User.reputationScore` thay vì compute on-the-fly?** → Score hiện trên mọi listing card → query phải nhanh. ReputationEvent là source of truth, score là cache.
3. **Time decay có drift không?** → Có. Sau 1000 events nhỏ → race condition giữa decay cron và new events. Mitigation: decay job dùng `prisma.$transaction` + lock row, OR redo từ events nếu phát hiện drift > 5 điểm.
4. **Moderator scope — tại sao community moderator không thấy report của community khác?** → SRS § 2.3: "elevated privileges in their community scope". Filter trong query. Admin thấy hết.
5. **Suspend user vs delete?** → Suspend = `status=SUSPENDED`, login fail nhưng giữ data (cho appeal). Delete = anonymise transaction history, hard-remove profile (right to be forgotten).

### Demo prep

1. Show 100 user seed với varying reputation → tier distribution.
2. Live: User A complete txn với B → +10 score → tier auto-update from "active" → "trusted".
3. Anti-gaming: tạo 2 user X,Y chỉ trade với nhau 5 lần → run anti-gaming detector → flag both, xuất hiện trong mod queue.
4. Live: User C report listing of D với reason "Wrong price" → mod review → action `REMOVE_LISTING` → listing.status = REMOVED.
5. Show audit trail: `ModerationAction` rows.

### Bạn cần đồng bộ với

- **#4 (Transactions + events.ts)**: subscribe events `txn.completed`, `txn.cancelled`, `rating.created` theo contract `events.ts` của #4; emit notification event khi moderation áp dụng để #4 dispatch.
- **#1 (Auth)**: khi suspend user → set `User.status = SUSPENDED` trong transaction. #1 đảm bảo login bị reject.
- **#2 (Listings + Community posts)**: khi remove listing → `Listing.status = REMOVED` (#2 đã có method); comment của bạn đính vào `CommunityPost` của #2 (đọc `postId`).
- **#3 (Community groups)**: component thảo luận của bạn được #3 nhúng vào trang `/communities/[id]`; community-mod actions ghi qua service nhóm của #3.
- **TẤT CẢ (DevOps)**: bạn duyệt mọi migration (`schema.prisma`); giữ CI xanh; cấm `prisma db push` lên branch shared.

### Đọc thêm — đào sâu / case studies

> Vai bạn là "điểm nhấn báo cáo" — phải research đủ sâu để defense answer câu hỏi mở.

| Topic | Tài liệu | Tại sao đáng đọc |
|---|---|---|
| **Resnick & Zeckhauser — "Reputation Systems"** | Comm. ACM 43(12), 2000, http://www.si.umich.edu/~presnick/papers/cacm00/reputations.pdf | Paper gốc của reputation systems. Section 3 (design issues) đặc biệt quan trọng. **Cite vào báo cáo.** |
| **eBay reputation paper (Resnick et al., 2006)** | https://www.si.umich.edu/~presnick/papers/postcards/ResnickZeckhauserSwansonLockwood.pdf | Empirical study: tốt nhất nên dùng số rating hay tỷ lệ tốt/xấu? Real data từ eBay. |
| **"Trust & Safety" book** (Charlotte Willner et al., 2024) | overview: https://www.tspa.org/curriculum-materials/ | Bộ giáo trình TSPA mới nhất về T&S ops. Đọc 1 chương "Policy Development". |
| **Stack Overflow reputation rules** | https://stackoverflow.com/help/whats-reputation + https://meta.stackexchange.com/questions/7237/how-does-the-reputation-system-work | Case study đỉnh cao — 15 năm tinh chỉnh anti-gaming. So sánh với BookBridge. |
| **Reddit AutoModerator design** | https://www.reddit.com/r/RedditEng/comments/zlh1lc/automod_a_look_under_the_hood/ | Soft moderation tự động vs human-in-loop |
| **Sift Science — fraud patterns** | https://blog.sift.com/category/fraud-and-trust/ | Real-world patterns: account takeover, collusion ring detection. Áp dụng cho anti-gaming. |
| **Sybil attack defense** | https://www.usenix.org/legacy/event/sec06/tech/full_papers/yu/yu.pdf (SybilGuard) | Network-based detection — đọc abstract + intro. Background cho anti-gaming. |
| **Game theory of reputation** | "Game-Theoretic Models of Trust" — Jurca & Faltings 2003, https://infoscience.epfl.ch/record/52696 | Hiểu vì sao incentive design quan trọng. 1 chương đủ. |
| **Section 230 + content moderation law** | https://www.eff.org/issues/cda230 (EFF primer) | Background luật: tại sao platform moderate được mà không bị kiện về nội dung user. Liên quan VN: Luật ANM 2018. |
| **Discord Trust & Safety Transparency Report** | https://discord.com/safety/360044103651-Discord-Transparency-Reports | Format report thực tế — copy idea cho admin dashboard. |
| **Connected components algorithm (Union-Find)** | CTCI ch. 4 hoặc https://cp-algorithms.com/data_structures/disjoint_set_union.html | Nâng cấp anti-gaming: phát hiện trading rings ≥3 user (không chỉ pair) |
| **Belief propagation cho fraud** | https://snap.stanford.edu/ringattack/ — Stanford SNAP | Idea báo cáo "future work": graph-based fraud detection |

**Khi nào nên đọc**: tuần 1 (Resnick & Zeckhauser trước khi design score formula), tuần 3 (anti-gaming + Sybil paper), tuần 7 (Section 230 cho slide báo cáo về compliance).


---

## 👤 Người 6 — Artifacts (văn học tương tác) + Messaging

> Vai này có 2 đặc điểm: (1) **khép kín** — Artifacts là tính năng đặc trưng, gần như không phụ thuộc DB module khác → bạn debug độc lập; (2) **heavy frontend** — game engine + UI nhập vai (canvas, panorama 360°, particle, audio). Kèm **Messaging** (chat realtime) chuyển từ #4 sang để cân khối lượng.

### Khách hàng cần gì (SRS mapping)

| SRS section | Yêu cầu chính | Cường độ |
|---|---|---|
| **Artifacts — value-add** *(ngoài SRS gốc — đánh dấu Assumption)* | biến tác phẩm (*Tắt đèn / Tức nước vỡ bờ*, *The Alchemist*) thành trải nghiệm chơi tương tác + lớp thảo luận | High (điểm nhấn sáng tạo) |
| **§ 4.8 In-app Messaging** *(từ #4 cũ)* | 1-1 chat giữa requester và owner, optional tied to transaction; realtime | Medium |
| § 4.6 Social (1 phần) | emit `message.created` để dispatcher của #4 bắn notification | Medium |

> ⚠️ **Assumption**: "Artifacts" không có trong SRS gốc của khách hàng — đây là tính năng nhóm thêm vào để tăng engagement. Khi báo cáo, trình bày rõ là *extension*, không phải requirement khách hàng.

**Yêu cầu chi tiết bạn chịu trách nhiệm** (REQ-IDs):

- `REQ-ART-001` Trang danh sách artifact + registry resolve theo `slug`
- `REQ-ART-002` Game engine: trạng thái health / thắng / thua, narration theo bước, đồng bộ audio
- `REQ-ART-003` UI nhập vai: panorama viewer, particle, audio player, victory/gameover screen
- `REQ-ART-004` Thảo luận artifact: comment + like (`ArtifactComment`, `ArtifactCommentLike`)
- `REQ-ART-005` Thêm artifact mới = khai báo `*-story.ts` + `*-audio.ts` + đăng ký `registry.ts` (không sửa engine)
- `REQ-MSG-001` *(từ #4 cũ)* In-app message giữa 2 user, optional tied to transaction
- `REQ-MSG-002` *(từ #4 cũ)* Realtime push qua SSE; chỉ 2 bên trong hội thoại đọc được
- `REQ-MSG-003` *(từ #4 cũ)* Emit `message.created` cho dispatcher của #4

### Code bạn sở hữu

```
# Artifacts (văn học tương tác)
src/lib/artifacts/registry.ts           # ⭐ đăng ký artifact theo slug
src/lib/artifacts/game-types.ts         # ⭐ engine types (health/step/outcome) — tách khỏi dữ liệu
src/lib/artifacts/alchemist-story.ts    # dữ liệu cốt truyện The Alchemist
src/lib/artifacts/alchemist-audio.ts
src/lib/artifacts/tat-den-story.ts      # dữ liệu Tắt đèn / Tức nước vỡ bờ
src/lib/artifacts/tat-den-audio.ts
src/server/artifacts/comments.ts        # comment + like CRUD

src/app/api/artifacts/[slug]/comments/route.ts           # GET/POST thảo luận
src/app/api/artifacts/comments/[commentId]/route.ts      # DELETE
src/app/api/artifacts/comments/[commentId]/like/route.ts # POST/DELETE like

src/app/artifacts/page.tsx                               # danh sách artifact
src/app/artifacts/the-alchemist/page.tsx
src/app/artifacts/tuc-nuoc-vo-bo/page.tsx
src/components/artifacts/{ArtifactGame,GameNarration,HealthBar,GameOverScreen,VictoryScreen,PanoramaViewer,DesertParticles,AudioPlayer,ArtifactDiscussion}.tsx

# Messaging (từ #4 cũ)
src/server/messaging/service.ts         # conversation + message
src/server/messaging/sse.ts             # SSE realtime (helper chung lấy từ src/server/lib/)
src/app/api/conversations/route.ts                      # list
src/app/api/conversations/[id]/messages/route.ts        # GET + POST
src/app/api/conversations/[id]/stream/route.ts          # SSE
src/app/messages/page.tsx                               # inbox
src/app/messages/[conversationId]/page.tsx              # chat thread
(component chat được #4 nhúng vào /transactions/[id])

prisma/schema.prisma → ArtifactComment, ArtifactCommentLike, Conversation, Message
tests/artifacts.test.ts (game state, registry), tests/messaging.test.ts (gửi/nhận, phân quyền 2 bên)
```

> **Phụ thuộc tối thiểu**: chỉ cần `getCurrentUser()`/`requireUser()` của #1. `Conversation.transactionId` là soft link (SetNull) tới Transaction của #4 — chỉ đọc id. Bạn KHÔNG còn giữ DevOps/CI (đã chuyển #5) và notifications (đã chuyển #4).

### Đọc / nghiên cứu

| Topic | Tài liệu | Thời gian |
|---|---|---|
| Game loop & state management trong React | https://react.dev/learn/managing-state | 2 h |
| Canvas API / requestAnimationFrame (particle, animation) | https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API | 2 h |
| Panorama 360° viewer | https://pannellum.org/documentation/overview/ | 1 h |
| Web Audio / HTMLAudioElement (đồng bộ narration ↔ audio) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API | 1 h |
| Branching narrative / interactive fiction design | https://twinery.org (concept) | 1 h |
| Server-Sent Events (cho messaging) | https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events | 1 h |

### Việc theo tuần

| Tuần | Việc |
|---|---|
| 1 | Đọc Common ground + game-loop/Canvas. Chạy thử 2 artifact hiện có, đọc `registry.ts` + `game-types.ts`. |
| 2 | Tách rõ engine (`game-types.ts`) khỏi dữ liệu (`*-story.ts`). Viết 1 artifact "hello" tối giản để hiểu pipeline. |
| 3 | Game state engine: health / step / outcome (thắng/thua) + narration theo bước. Test `tests/artifacts.test.ts`. |
| 4 | UI nhập vai: HealthBar, GameNarration, Victory/GameOver, AudioPlayer — đồng bộ audio với bước truyện. |
| 5 | PanoramaViewer + DesertParticles (immersive). Trang `/artifacts/[slug]` hoàn chỉnh 1 artifact end-to-end. |
| 6 | Messaging: conversation + message CRUD + trang `/messages`. Phân quyền chỉ 2 bên đọc hội thoại. |
| 7 | SSE realtime cho chat (test 2 tab). Emit `message.created` cho dispatcher của #4. Thảo luận artifact (comment + like). |
| 8 | Báo cáo + slide phần Artifacts + Messaging (3 slide). |

### Câu hỏi nghiên cứu

1. **Tại sao tách engine (`game-types.ts`) khỏi dữ liệu (`*-story.ts`)?** → Thêm artifact mới chỉ cần khai báo dữ liệu + đăng ký `registry.ts`, không động vào engine → mở rộng an toàn, test engine độc lập.
2. **Game state quản lý ở client hay server?** → Trải nghiệm chơi chạy client-side (state trong React, không cần round-trip); chỉ comment/like mới gọi API. Không lưu tiến trình chơi vào DB (Assumption — ngoài scope SRS).
3. **Đồng bộ narration ↔ audio thế nào?** → Mỗi bước truyện gắn 1 audio cue; dùng event `ended`/`timeupdate` của HTMLAudioElement để chuyển bước, tránh lệch.
4. **SSE trong Vercel serverless có giới hạn không?** → Vercel function timeout 60 s free tier; SSE giữ kết nối → cần `maxDuration` (Pro) hoặc client reconnect mỗi 60 s. (Helper SSE dùng chung với notification của #4.)
5. **Messaging — chỉ 2 bên đọc được, enforce ở đâu?** → Server-side: mỗi query kiểm `userId ∈ {conversation.userA, userB}`; 403 nếu không. Không tin client.
6. **Artifacts có trong SRS không?** → Không — là extension nhóm thêm để tăng engagement (đánh dấu Assumption). Trình bày rõ trong báo cáo là *value-add*, không phải requirement khách hàng.

### Demo prep

1. Live: mở `/artifacts` → chọn *Tức nước vỡ bờ* → chơi qua vài bước (narration + audio + health) → tới Victory/GameOver screen.
2. Show panorama 360° + particle để minh hoạ phần immersive UI.
3. Show "thêm artifact mới" chỉ bằng khai báo `*-story.ts` + `registry.ts` (không sửa engine).
4. Thảo luận: comment + like dưới 1 artifact.
5. Messaging live: User A ↔ User B chat trong conversation tied to transaction → SSE realtime 2 tab.
6. Show test pass: `npm test tests/artifacts.test.ts tests/messaging.test.ts`.

### Bạn cần đồng bộ với

- **#1 (Auth)**: dùng `getCurrentUser()` / `requireUser()` cho comment/like + gửi message.
- **#4 (Transactions + events.ts)**: emit `message.created` theo contract `events.ts` để dispatcher của #4 notify; nhúng component chat vào `/transactions/[id]`. `Conversation.transactionId` soft-link tới Transaction (chỉ đọc).
- **#5 (DevOps)**: tag #5 khi cần migration cho `ArtifactComment`/`Conversation`/`Message`.

### Đọc thêm — đào sâu / case studies

> Vai bạn heavy về frontend tương tác — đọc về game design + animation + realtime. (Phần đọc DevOps/CI/12-Factor đã chuyển sang **#5** cùng trách nhiệm Ops.)

| Topic | Tài liệu | Tại sao đáng đọc |
|---|---|---|
| **Game Programming Patterns** (Nystrom, free online) | https://gameprogrammingpatterns.com — chương "State", "Game Loop", "Update Method" | Nền tảng cho game state engine của artifact. **Cite vào báo cáo.** |
| **The Art of Interactive Fiction / branching narrative** | https://emshort.blog (Emily Short) | Thiết kế nhánh truyện, nhịp kể — áp dụng cho `*-story.ts` |
| **Canvas & requestAnimationFrame deep dive** | https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame | Particle/animation mượt, tránh jank |
| **Web Audio API — scheduling** | https://web.dev/articles/audio-scheduling | Đồng bộ audio narration chính xác theo bước |
| **WebGL / panorama 360°** | https://threejs.org/docs (hoặc Pannellum) | Immersive viewer — chọn thư viện nhẹ phù hợp |
| **SSE vs WebSocket** | https://ably.com/blog/websockets-vs-sse | Lý giải vì sao chọn SSE cho chat realtime |
| **Signal Protocol (overkill nhưng wow)** | https://signal.org/docs/specifications/x3dh/ | Cite cho "Future work — E2E encrypted messaging" |
| **Accessibility cho game/animation** | https://www.w3.org/WAI/WCAG21/quickref/ | Prefers-reduced-motion, alt cho narration — tránh loại trừ người dùng |

**Khi nào nên đọc**: Game Programming Patterns (tuần 1–2 trước khi viết engine), Web Audio scheduling (tuần 4), SSE (tuần 6 trước messaging realtime).

---

## Integration points — ai phụ thuộc ai

### Ma trận phụ thuộc

> Cột = "vai này cần gì từ vai kia". Ownership v2: #1 Identity(+access) · #2 Catalog(+community posts) · #3 Discovery(+community groups) · #4 Transactions(+notifications, events.ts) · #5 Trust/Admin(+community discussion, DevOps) · #6 Artifacts(+messaging).

|  | needs from #1 | from #2 | from #3 | from #4 | from #5 | from #6 |
|---|---|---|---|---|---|---|
| **#1** | — | — | — | — | suspend trigger | — |
| **#2** | requireUser | — | post fan-out vào feed | activeTxn check + events.ts | report → remove | — |
| **#3** | requireUser + access gate | listing index + `community.post_created` | — | notify followers | discussion UI (comment/reaction) | — |
| **#4** | requireUser | listing status update + events | feed/community events | — | rep events | `message.created` |
| **#5** | suspend user API | post `postId` link | community-mod qua service nhóm | txn events + events.ts contract | — | — |
| **#6** | requireUser | — | — | events.ts + chat embed point | migration review (DevOps) | — |

### Quy ước giải quyết xung đột

* **Schema Prisma**: thay đổi nào cần consensus của 2+ owner. Ai sửa → tag #5 review (DevOps lead) cho migration.
* **Event signatures**: do #4 lock trong `src/server/lib/events.ts` tuần 2 (vì #4 sở hữu dispatcher); bất kỳ thay đổi sau tuần 3 cần meeting cả nhóm.
* **`getCurrentUser()` signature**: do #1 lock; thay đổi sau tuần 2 cần meeting.
* **Conflict trong PR**: ai merge sau rebase. Nếu conflict file shared (`schema.prisma`, `events.ts`, `lib/`): ai làm tới phần đó cuối cùng → ping owner trước khi push.

---

## Lịch họp đề xuất

| Tần suất | Buổi | Mục tiêu |
|---|---|---|
| **Daily standup (5 phút, async — Slack / Discord text)** | mỗi sáng | "yesterday / today / blockers" |
| **Weekly sync (45 phút)** | mỗi cuối tuần | demo what's done; plan next week; resolve cross-module questions |
| **Code-walk (45 phút)** | tuần 4 + tuần 6 | mỗi người demo code module mình cho 5 người còn lại — đảm bảo "ai cũng hiểu" |
| **Demo dry-run (90 phút)** | tuần 8 đầu | rehearse end-to-end pre-defense |

---

## Demo day — kịch bản 20 phút

| Phút | Việc | Người dẫn |
|---|---|---|
| 0–2 | Bối cảnh + SRS scope (slide 1–2 của presentation) | mọi người (1 người mở đầu) |
| 2–4 | Architecture overview (sơ đồ ARCHITECTURE.md) | #5 |
| 4–6 | User flow: register → verify → login | #1 |
| 6–8 | Tạo listing với ISBN auto-fill | #2 |
| 8–10 | Search + filter; follow user; community group + feed | #3 |
| 10–14 | Transaction lifecycle (request → accept → ship → complete → rate) + chat embed | #4 (chat component của #6) |
| 14–17 | Reputation + anti-gaming + report → moderator action + admin dashboard/grant CSV | #5 |
| 17–19 | Notifications realtime (#4) + Artifacts văn học tương tác demo (#6) | #4 + #6 |
| 19–20 | Closing + Q&A | mọi người |

### Q&A — chia trách nhiệm trả lời

| Câu hỏi giảng viên có thể hỏi | Người trả lời |
|---|---|
| Tại sao chọn Next.js + Prisma + Postgres? | #5 (architecture/DevOps) |
| Bảo mật password? Session? | #1 |
| ISBN API rate limit? Fallback? | #2 |
| Search relevance ranking algorithm? | #3 |
| State machine — tại sao tách pure logic? | #4 |
| Anti-gaming — false positive? | #5 |
| Scaling notifications khi 10k users? | #4 |
| Artifacts có trong SRS không? Vì sao thêm? | #6 |

Quy tắc: ai bị hỏi câu của người khác, **chuyển micro lịch sự**: "Câu này thuộc về bạn X, mời X trả lời".

---

## Checklist tuần 8 trước demo

- [x] `npm test` xanh — tất cả 6 module
- [ ] CI xanh trên branch `main`
- [x] Seed data đầy đủ (3 user demo, 10 listings, 5 communities, 1 transaction in-flight)
- [ ] README.md update đầy đủ tên 6 thành viên + role
- [ ] TASKS.md + ROLES.md không còn "TBD"
- [ ] Slide 30 trang đã review chéo
- [ ] Báo cáo 30 trang đã review chéo
- [ ] Mỗi người đã practice phần demo của mình ≥ 2 lần
- [ ] Backup: video record full demo (phòng khi WiFi hỏng tại buổi defense).
