# BookBridge — Thiết kế Database & Phân công theo Use Case

> Tài liệu top-down: bắt đầu từ **một sơ đồ tổng thể**, rồi bổ ra thành **6 cụm sở hữu** (mỗi người 1 module), kèm use case và điểm chạm chéo (cross-module FK) để chia việc rõ ràng.

---

## 0. Tầm nhìn tổng thể — "Một bảng to" trước khi chia

Toàn hệ thống xoay quanh **`User`** ở trung tâm. Mọi entity khác đều bắt nguồn (trực tiếp hoặc gián tiếp) từ User: user đăng sách → sách sinh giao dịch → giao dịch sinh hội thoại, đánh giá, uy tín → song song có mạng xã hội (follow/feed), nhóm (community), kiểm duyệt (report), và thông báo gom tất cả lại.

```mermaid
erDiagram
    User ||--o{ Session : "đăng nhập"
    User ||--o{ Listing : "đăng sách"
    User ||--o{ Follow : "theo dõi / được theo dõi"
    User ||--o{ FeedItem : "nhận feed"
    User ||--o{ Transaction : "mua / bán"
    User ||--o{ Rating : "chấm / được chấm"
    User ||--o{ Message : "gửi tin nhắn"
    User ||--o{ ReputationEvent : "tích/trừ uy tín"
    User ||--o{ Report : "tố cáo / bị tố cáo"
    User ||--o{ ModerationAction : "xử lý / bị xử lý"
    User ||--o{ Community : "sở hữu nhóm"
    User ||--o{ CommunityMembership : "tham gia nhóm"
    User ||--o{ Notification : "nhận thông báo"

    Listing ||--o{ ListingPhoto : "có ảnh"
    Listing ||--o{ Transaction : "phát sinh giao dịch"
    Listing }o--o| Community : "phạm vi (nullable)"

    Transaction ||--o{ TransactionEvent : "nhật ký trạng thái"
    Transaction ||--o{ Rating : "đánh giá 2 chiều"
    Transaction ||--o| Conversation : "luồng chat gắn giao dịch"
    Conversation ||--o{ Message : "chứa tin nhắn"

    Report ||--o{ ModerationAction : "dẫn tới hành động"

    Community ||--o{ CommunityMembership : "có thành viên"
    Community ||--o{ CommunityPost : "chứa bài"
    CommunityPost ||--o{ CommunityPostLike : "lượt thích"
    CommunityPost ||--o{ CommunityPostComment : "bình luận"
```

**18 entity, gom thành 6 cụm sở hữu:**

```mermaid
flowchart TB
    subgraph P1["#1 Identity & Profile"]
        U[User]:::hub
        S[Session]
        EVT[EmailVerificationToken]
        PRT[PasswordResetToken]
    end
    subgraph P2["#2 Book Catalog"]
        L[Listing]
        LP[ListingPhoto]
    end
    subgraph P3["#3 Discovery"]
        F[Follow]
        FI[FeedItem]
    end
    subgraph P4["#4 Transactions & Messaging"]
        T[Transaction]
        TE[TransactionEvent]
        R[Rating]
        C[Conversation]
        M[Message]
    end
    subgraph P5["#5 Trust & Safety"]
        RE[ReputationEvent]
        RP[Report]
        MA[ModerationAction]
    end
    subgraph P6["#6 Community & Ops"]
        CM[Community]
        CMM[CommunityMembership]
        CP[CommunityPost]
        CPL[CommunityPostLike]
        CPC[CommunityPostComment]
        N[Notification]
    end

    P1 --> P2 --> P4
    P1 --> P3
    P4 --> P5
    P1 --> P6
    P2 -.communityId.-> P6
    classDef hub fill:#1A56DB,color:#fff,font-weight:bold;
```

| # | Module | Bảng sở hữu | Use case chính | Enum sở hữu |
|---|---|---|---|---|
| **1** | **Identity & Profile** | User, Session, EmailVerificationToken, PasswordResetToken | Đăng ký, xác thực email, đăng nhập/session, hồ sơ, đổi mật khẩu | `UserRole`, `AccountStatus` |
| **2** | **Book Catalog** | Listing, ListingPhoto | CRUD listing, upload ảnh, tra ISBN, trần giá | `BookCondition`, `TransactionType`, `ListingStatus` |
| **3** | **Discovery** | Follow, FeedItem | Tìm full-text, follow/unfollow, feed cá nhân hóa | — |
| **4** | **Transactions & Messaging** | Transaction, TransactionEvent, Rating, Conversation, Message | Máy trạng thái giao dịch, đánh giá 2 chiều, chat realtime | `TransactionStatus`, `DeliveryMethod` |
| **5** | **Trust & Safety** | ReputationEvent, Report, ModerationAction | Engine uy tín, tố cáo, hàng đợi kiểm duyệt | `ReputationKind`, `ReportTargetType`, `ReportStatus`, `ModerationActionKind` |
| **6** | **Community & Ops** | Community, CommunityMembership, CommunityPost, CommunityPostLike, CommunityPostComment, Notification | Nhóm con, bài viết/like/comment, thông báo, email digest | `CommunityScope`, `CommunityRole`, `NotificationKind`, `NotificationEmailPreference` |

---

## 1. Identity & Profile (#1) — *gốc của mọi thứ*

`User` là hub. Mọi FK của hệ thống cuối cùng đều trỏ về đây. Người #1 sở hữu vòng đời tài khoản và là người **không bao giờ được đổi `User.id`**.

```mermaid
erDiagram
    User ||--o{ Session : "phiên đăng nhập"
    User ||--o{ EmailVerificationToken : "xác thực email"
    User ||--o{ PasswordResetToken : "reset mật khẩu"
    User {
        string id PK "cuid — KHÓA của cả hệ thống"
        string email UK
        string passwordHash
        string displayName
        string avatarUrl "nullable"
        string bio "nullable"
        string_array preferredGenres
        string locationDistrict "chỉ cấp quận"
        enum role "GUEST|USER|MODERATOR|ADMIN"
        enum status "PENDING_VERIFICATION|ACTIVE|SUSPENDED|DELETED"
        datetime emailVerifiedAt
        int reputationScore "denormalized — tổng ReputationEvent"
        string reputationTier "denormalized"
        enum notificationEmailPreference
        int followerCount "denormalized"
        int followingCount "denormalized"
    }
    Session {
        string id PK
        string userId FK
        datetime expiresAt
        datetime revokedAt "null = còn hiệu lực"
    }
```

**Use case → ai chạm bảng nào:**

| Use case | Ghi | Đọc |
|---|---|---|
| Đăng ký | `User` (status=PENDING), `EmailVerificationToken` | — |
| Xác thực email | `User.emailVerifiedAt`, `User.status`→ACTIVE; `EmailVerificationToken.usedAt` | token |
| Đăng nhập | `Session` | `User.passwordHash` |
| Quên mật khẩu | `PasswordResetToken`, `User.passwordHash` | token |
| Sửa hồ sơ | `User` (bio, avatar, genres, district) | — |

**Điểm thiết kế:**
- 4 field denormalized trên User (`reputationScore`, `reputationTier`, `followerCount`, `followingCount`) — **người #1 không tự ghi chúng**, mà do #3 (follow) và #5 (reputation) cập nhật. Đây là touch point quan trọng nhất: ai sửa phải sửa trong transaction.
- Token (email/reset) tách 2 bảng riêng, cùng pattern `tokenHash + expiresAt + usedAt`.

---

## 2. Book Catalog (#2)

```mermaid
erDiagram
    User ||--o{ Listing : "owner"
    Listing ||--o{ ListingPhoto : "ảnh có thứ tự"
    Listing }o--o| Community : "communityId nullable"
    Listing {
        string id PK
        string ownerId FK
        string title
        string author
        string isbn "nullable"
        enum condition "NEW|LIKE_NEW|GOOD|FAIR|POOR"
        enum transactionType "GIFT|EXCHANGE|SELL"
        int askingPriceVnd "bắt buộc nếu SELL, có trần"
        string communityId FK "NULL = toàn cục"
        enum status "ACTIVE|RESERVED|UNAVAILABLE|COMPLETED|REMOVED"
    }
    ListingPhoto {
        string id PK
        string listingId FK
        string url
        int position "thứ tự hiển thị"
    }
```

| Use case | Ghi | Quy tắc nghiệp vụ |
|---|---|---|
| Tạo listing | `Listing`, `ListingPhoto[]` | SELL → bắt buộc giá + ≤ trần; description 20–2000 ký tự |
| Sửa / ẩn | `Listing` (status→UNAVAILABLE) | chỉ owner |
| Xóa | `Listing.status`→REMOVED | owner / mod (xem #5) |
| Tra ISBN | — (gọi API ngoài, điền sẵn form) | — |

**Touch point:** `Listing.status` bị **#4 điều khiển** khi giao dịch chạy (ACTIVE→RESERVED→COMPLETED). `Listing.communityId` trỏ sang **#6** với `onDelete: SetNull` — xóa nhóm thì listing thành toàn cục, không mất.

---

## 3. Discovery (#3)

```mermaid
erDiagram
    User ||--o{ Follow : "follower"
    User ||--o{ Follow : "followee"
    User ||--o{ FeedItem : "recipient"
    Follow {
        string followerId PK_FK
        string followeeId PK_FK
    }
    FeedItem {
        string id PK
        string userId FK "người nhận"
        string listingId FK "nullable"
        string kind "new_listing|community_announcement"
        json payload "tự chứa, render không cần join"
        bool seen
    }
```

| Use case | Ghi | Đọc |
|---|---|---|
| Follow / unfollow | `Follow` ±, `User.followerCount/followingCount` ± | — |
| Feed cá nhân hóa | `FeedItem` (fan-out khi #2 đăng sách) | feed phân trang `(userId, createdAt)` |
| Tìm full-text | — | `Listing` (index `status, genre, transactionType`) |

**Touch point lớn nhất của dự án:** khi #2 đăng 1 listing, **fan-out job** (`fanout.ts`) quét follower của owner + thành viên community → ghi `FeedItem` **và** `Notification` (#6) **cùng một lượt**. Đây là chỗ 3 module (#2, #3, #6) gặp nhau — cần thống nhất ai gọi ai.

```mermaid
flowchart LR
    A[#2 tạo Listing] --> B[fanout.ts]
    B --> C[(#3 FeedItem)]
    B --> D[(#6 Notification)]
    B -.quét.-> E[#3 Follow]
    B -.quét.-> F[#6 CommunityMembership]
```

---

## 4. Transactions & Messaging (#4)

Trái tim logic của hệ thống. Người #4 sở hữu **máy trạng thái** — nơi duy nhất được phép đổi `Transaction.status` và `Listing.status`.

```mermaid
stateDiagram-v2
    [*] --> PENDING: requester gửi yêu cầu
    PENDING --> ACCEPTED: owner đồng ý
    PENDING --> DECLINED: owner từ chối
    PENDING --> WAITLISTED: đã có request khác được nhận
    ACCEPTED --> IN_DELIVERY: owner giao (in-person/postal)
    IN_DELIVERY --> COMPLETED: requester xác nhận nhận
    ACCEPTED --> CANCELLED: hủy → promote waitlist
    COMPLETED --> DISPUTED: tranh chấp
    DISPUTED --> COMPLETED: mod resolve
    DISPUTED --> CANCELLED: mod reject
    COMPLETED --> [*]
```

```mermaid
erDiagram
    Listing ||--o{ Transaction : ""
    Transaction ||--o{ TransactionEvent : "audit log"
    Transaction ||--o{ Rating : "2 chiều"
    Transaction ||--o| Conversation : "luồng chat"
    Conversation ||--o{ Message : ""
    Transaction {
        string id PK
        string listingId FK
        string requesterId FK
        string ownerId FK "denormalized tiện query"
        enum status
        enum type "ảnh chụp transactionType lúc request"
        enum deliveryMethod "IN_PERSON|POSTAL nullable"
    }
    Rating {
        string id PK
        string transactionId FK
        string fromUserId FK
        string toUserId FK
        int stars "1-5"
    }
    Conversation {
        string id PK
        string userAId FK "luôn sort < userBId"
        string userBId FK
        string transactionId FK "unique, nullable"
    }
```

| Use case | Ghi | Side-effect (cùng transaction) |
|---|---|---|
| Gửi yêu cầu | `Transaction` (PENDING), `TransactionEvent` | → notify owner (#6) |
| Accept | status→ACCEPTED, `Listing`→RESERVED, mở `Conversation` | → notify requester |
| Complete | status→COMPLETED, `Listing`→COMPLETED | → **+10 uy tín cả 2 (#5)** + notify |
| Đánh giá | `Rating` (unique theo chiều) | → uy tín (#5) |
| Chat | `Message`, `Conversation.lastMessageAt` | → notify người nhận (#6) |

**Touch point:** mỗi lần `transition()` xong, side-effect gọi sang **#5 (reputation)** và **#6 (notification)**. Người #4 phát `DomainEvent`, không tự ghi notification/uy tín — để logic "ai nhận / cộng bao nhiêu" nằm ở chủ sở hữu module đó.

---

## 5. Trust & Safety (#5)

```mermaid
erDiagram
    User ||--o{ ReputationEvent : "mỗi delta 1 dòng"
    User ||--o{ Report : "filer / target"
    Report ||--o{ ModerationAction : ""
    ReputationEvent {
        string id PK
        string userId FK
        enum kind "TRANSACTION_COMPLETED|RATING_RECEIVED|REPORT_UPHELD|CANCELLATION|COMMUNITY_CONTRIBUTION|TIME_DECAY"
        int delta "có dấu"
        json context "vd transactionId"
    }
    Report {
        string id PK
        string filerId FK "nullable (system-gen)"
        bool isSystemGenerated
        enum targetType "USER|LISTING|TRANSACTION|MESSAGE"
        string targetUserId FK "nullable"
        string targetListingId FK "nullable"
        enum status "PENDING|RESOLVED|REJECTED"
    }
    ModerationAction {
        string id PK
        string reportId FK "nullable"
        string byUserId FK "moderator"
        string onUserId FK "người bị xử lý"
        enum kind "WARN|REMOVE_LISTING|SUSPEND_USER|RESTORE|RESOLVE_DISPUTE|REJECT_DISPUTE|REJECT_REPORT"
    }
```

| Use case | Ghi | Hệ quả |
|---|---|---|
| Tố cáo | `Report` (PENDING) | vào hàng đợi |
| Mod xử lý | `ModerationAction`, `Report.status` | nếu upheld → `ReputationEvent` âm + notify (#6); REMOVE_LISTING → `Listing`→REMOVED (#2) |
| Engine uy tín | `ReputationEvent`, cập nhật `User.reputationScore/Tier` (#1) | nếu đổi tier → notify (#6) |

**Điểm cốt lõi:** `User.reputationScore` là **tổng** các `ReputationEvent`. Engine kẹp điểm trong `[0,100]`, đổi tier thì bắn `reputation.tier_changed`. Người #5 là **người duy nhất** được ghi `ReputationEvent` và sửa `User.reputationScore`.

---

## 6. Community & Ops (#6)

```mermaid
erDiagram
    Community ||--o{ CommunityMembership : ""
    Community ||--o{ CommunityPost : ""
    CommunityPost ||--o{ CommunityPostLike : ""
    CommunityPost ||--o{ CommunityPostComment : ""
    User ||--o{ Notification : ""
    Community {
        string id PK
        string ownerId FK
        enum scope "UNIVERSITY|LOCATION|GENRE"
        bool isPrivate
        string inviteCode UK "nullable"
        int memberCount "denormalized"
    }
    CommunityMembership {
        string userId PK_FK
        string communityId PK_FK
        enum role "MEMBER|MODERATOR"
        int communityPoints
    }
    CommunityPost {
        string id PK
        int likeCount "denormalized"
        int commentCount "denormalized"
    }
    Notification {
        string id PK
        string userId FK "1 bản ghi / 1 người nhận"
        enum kind "9 loại"
        json payload "tự chứa"
        datetime readAt
        datetime emailSentAt
    }
```

| Use case | Ghi | Đếm denormalized |
|---|---|---|
| Tạo/join/leave nhóm | `Community`, `CommunityMembership` | `memberCount` ± 1 |
| Đăng bài | `CommunityPost` | `communityPoints` +5 → notify cả nhóm |
| Like / comment | `CommunityPostLike` / `Comment` | `likeCount/commentCount` ±1, điểm ±2/+3 → notify tác giả |
| Thông báo | `Notification` (fan-out) | đọc/gửi email theo `readAt`/`emailSentAt` |

**#6 là "trạm thu gom":** notification đến từ **mọi module** (giao dịch #4, listing #2, uy tín #5, kiểm duyệt #5, community #6) đều đổ về bảng `Notification`. Chi tiết flow xem `Notifications_v2.md` và `Community_v2.md`.

---

## 7. Bản đồ điểm chạm chéo — *cẩm nang tránh dẫm chân nhau*

Bảng này là thứ cả nhóm cần dán lên tường. Cột "Chủ" = người được phép **ghi**; cột "Đọc/kích hoạt" = người phụ thuộc.

| Field / Bảng | Chủ (ghi) | Ai đọc / kích hoạt ghi | Ghi chú |
|---|---|---|---|
| `User.id` | #1 | tất cả | Bất biến — không bao giờ đổi |
| `User.reputationScore/Tier` | **#5** | #1 đọc hiển thị | #1 sở hữu bảng nhưng KHÔNG ghi field này |
| `User.followerCount/followingCount` | **#3** | #1 đọc hiển thị | tương tự trên |
| `User.status` | #1, **#5** | mọi nơi check ACTIVE | #5 set SUSPENDED qua moderation |
| `Listing.status` | #2, **#4** | #3 (feed), #5 (remove) | #4 điều khiển khi giao dịch chạy |
| `Listing.communityId` | #2 | #6 (đếm member để fan-out) | `onDelete: SetNull` |
| `Transaction` side-effects | #4 phát event | #5 (uy tín), #6 (notify) | #4 không tự ghi 2 bảng kia |
| `Notification` | **#6** | mọi module gọi `dispatchNotifications` | trạm thu gom |
| `FeedItem` | **#3** | #2/#6 kích hoạt qua fanout | |

```mermaid
flowchart TB
    P4[#4 Transaction hoàn tất] -->|DomainEvent| P5[#5 ghi ReputationEvent]
    P5 -->|cập nhật| U1[#1 User.reputationScore]
    P5 -->|tier đổi| P6[#6 Notification]
    P4 -->|DomainEvent| P6
    P2[#2 đăng Listing] -->|fanout| P3[#3 FeedItem]
    P2 -->|fanout| P6
    P5b[#5 moderation REMOVE] -->|set status| P2b[#2 Listing.status]
    P3b[#3 follow] -->|cập nhật| U2[#1 User.followerCount]
```

---

## 8. Tóm tắt phân công

| Người | Module | Số bảng | Độ phức tạp | Phụ thuộc chính |
|---|---|---|---|---|
| **#1** | Identity & Profile | 4 | Trung bình | Là gốc — ai cũng phụ thuộc #1 |
| **#2** | Book Catalog | 2 | Thấp–TB | Phụ thuộc #1; bị #4 sửa status |
| **#3** | Discovery | 2 | TB (fan-out) | Phụ thuộc #1, #2 |
| **#4** | Transactions & Messaging | 5 | **Cao** (state machine) | Kích hoạt #5, #6 |
| **#5** | Trust & Safety | 3 | **Cao** (uy tín engine) | Ghi vào #1; bị #4 kích hoạt |
| **#6** | Community & Ops | 6 | Cao (trạm notify) | Nhận event từ mọi module |

**3 nguyên tắc vàng cho cả nhóm:**
1. **Chỉ chủ sở hữu được ghi field của mình** — đặc biệt 4 field denormalized trên `User` (#5 và #3 ghi, không phải #1).
2. **Side-effect đi qua `DomainEvent`** — #4 không tự ghi notification/uy tín, mà phát event cho #5/#6 xử lý.
3. **Đếm denormalized sửa trong cùng transaction** với thao tác gốc (`memberCount`, `likeCount`, `commentCount`, `reputationScore`, `followerCount`) — quên = số liệu lệch vĩnh viễn.
