# Community — Tài liệu tính năng & backend

## 1. Tính năng (top-down)
Community là các **nhóm con** (theo trường / khu vực / thể loại) nơi thành viên đăng bài, tương tác, và rao sách trong phạm vi nhóm. Mọi tính năng xoay quanh 4 trục:

```mermaid
mindmap
  root((Community))
    Vòng đời nhóm
      Tạo nhóm
      Xóa nhóm
      Công khai / Private
    Thành viên
      Join trực tiếp
      Join bằng invite code
      Rời nhóm
      Thăng / giáng Moderator
      Xóa thành viên
    Nội dung
      Đăng / xóa bài
      Ghim bài
      Like / Unlike
      Bình luận / Xóa bình luận
    Phạm vi & thưởng
      Listing gắn nhóm
      Community points
```

Community là các nhóm con (theo trường / khu vực / thể loại) nơi thành viên đăng bài, tương tác, và rao sách trong phạm vi nhóm.

| Nhóm tính năng | Mô tả | Ai được làm |
|---|---|---|
| **Tạo / xóa community** | Lập nhóm mới (UNIVERSITY/LOCATION/GENRE), công khai hoặc private | Tạo: user bất kỳ · Xóa: owner hoặc ADMIN |
| **Tham gia** | Join trực tiếp (public) hoặc bằng invite code (private).| User |
| **Rời nhóm** | Rời community (owner không thể rời) | Member |
| **Bài viết (Post)** | Tạo / xóa bài, ghim (pin) bài | Tạo: member · Xóa: tác giả hoặc mod · Ghim: mod |
| **Tương tác** | Like / bỏ like, bình luận, xóa bình luận | Like+comment: member · Xóa comment: tác giả hoặc mod |
| **Listing trong nhóm** | Sách rao gắn `communityId` hiện trong nhóm; gỡ listing | Thêm: member (qua trang tạo listing) · Gỡ: chủ listing hoặc mod |
| **Quản trị thành viên** | Thăng/giáng MODERATOR, xóa thành viên, tạo lại invite code | Owner/ADMIN (mod có thể xóa member) |
| **Community points** | Điểm tích lũy theo hoạt động: +5 đăng bài, +3 bình luận, +2 like | Tự động |

### Phân quyền (3 cấp)
```mermaid
flowchart TD
    ADMIN[ADMIN toàn cục<br/>đứng trên mọi nhóm] --> OWNER
    OWNER[Owner<br/>người tạo nhóm] --> MOD
    MOD[Moderator<br/>quản nội dung + thành viên] --> MEM
    MEM[Member<br/>đăng bài, tương tác, rao sách]

    OWNER -.->|"không thể bị giáng/xóa/rời"| OWNER
    MOD -.->|"không được đụng tới owner"| MOD
```
- **Owner** — người tạo nhóm; toàn quyền, không thể bị giáng/xóa/rời.
- **Moderator** — quản lý nội dung & thành viên (trừ đụng tới owner).
- **Member** — đăng bài, tương tác, rao sách.
- *(ADMIN toàn cục đứng trên tất cả.)*

```mermaid
flowchart TD
  
    User -->|tạo nhóm| Owner
    User -->|join / invite code| Member
    Member -->|owner thăng cấp| Moderator
    Moderator -->|owner giáng cấp| Member
    Owner -->|toàn quyền| Manage[Quản trị nhóm]
    Moderator -->|nội dung + thành viên| Manage
    Member -->|đăng bài, like, comment, rao sách| Content[Nội dung]
```

**Ai làm được gì:**

| Hành động | Member | Moderator | Owner | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Đăng bài, like, bình luận, rao sách | ✅ | ✅ | ✅ | ✅ |
| Xóa bài / bình luận của **chính mình** | ✅ | ✅ | ✅ | ✅ |
| Ghim bài | ❌ | ✅ | ✅ | ✅ |
| Xóa bài / bình luận của **người khác** | ❌ | ✅ | ✅ | ✅ |
| Xóa thành viên | ❌ | ✅ | ✅ | ✅ |
| Thăng / giáng Moderator | ❌ | ❌ | ✅ | ✅ |
| Tạo lại invite code | ❌ | ✅ | ✅ | ✅ |
| Xóa nhóm | ❌ | ❌ | ✅ | ✅ |

> Quy tắc bất biến: **Owner không thể bị giáng, xóa, hay tự rời nhóm.** Moderator quản được nội dung và thành viên thường, nhưng chạm tới owner thì bị chặn. Việc thăng/giáng mod là đặc quyền riêng của owner (và ADMIN).

## 2. Mô hình dữ liệu

```mermaid
erDiagram
    Community ||--o{ CommunityMembership : "có thành viên"
    Community ||--o{ CommunityPost : "chứa bài"
    Community ||--o{ Listing : "phạm vi (communityId nullable)"
    User ||--o{ CommunityMembership : "tham gia"
    User ||--o{ CommunityPost : "tác giả"
    CommunityPost ||--o{ CommunityPostLike : "lượt thích"
    CommunityPost ||--o{ CommunityPostComment : "bình luận"

    Community {
        string id PK
        string ownerId FK
        string name UK
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
        string communityId FK
        string authorId FK
        bool isPinned
        int likeCount "denormalized"
        int commentCount "denormalized"
    }
    CommunityPostLike {
        string userId PK_FK
        string postId PK_FK
    }
    CommunityPostComment {
        string id PK
        string postId FK
        string authorId FK
    }
```

**Điểm thiết kế cần nhớ:**
- `CommunityMembership` dùng **khóa chính kép** `(userId, communityId)` → mỗi user chỉ có 1 membership/nhóm; role nằm trên bảng này.
- `memberCount`, `likeCount`, `commentCount` là **denormalized**, phải cập nhật thủ công trong cùng transaction mỗi khi thêm/bớt (xem flow bên dưới).
- `Listing.communityId` **nullable**: `NULL` = listing toàn cục; có giá trị = chỉ thuộc nhóm đó. `onDelete: SetNull` → xóa nhóm thì listing trở thành toàn cục, không mất.
- Quan hệ con (`onDelete: Cascade`): xóa community/post tự động dọn membership, post, like, comment.

## 3. Kiến trúc backend

3 lớp, tách bạch rõ:

```mermaid
flowchart LR
    UI[Client component<br/>CommunityActions, PostActions...] -->|fetch| API[API route<br/>/api/communities/...]
    API -->|auth + parse| SVC[Service layer<br/>communities/service.ts]
    SVC -->|prisma.$transaction| DB[(PostgreSQL)]
    SVC -.->|side-effect| NOTIF[dispatchNotifications]
    SVC -.->|side-effect| FAN[fanoutExistingListingsToUser]
```

- **API route** (`src/app/api/communities/**`): xác thực qua iron-session, parse body bằng Zod, gọi service, map lỗi → HTTP status.
- **Service** (`src/server/communities/service.ts`): toàn bộ business logic. Mọi thao tác ghi đều bọc trong `prisma.$transaction` để đảm bảo tính nguyên tử (ghi dữ liệu + cập nhật bộ đếm + bắn notification cùng lúc, hoặc rollback hết).
- **Phân quyền** tập trung ở helper `assertCommunityMod(actor, community, membership)` — kiểm tra mod/owner/admin, ném `ForbiddenError` nếu không đủ quyền.

### Flow 1 — Tham gia bằng invite code

```mermaid
sequenceDiagram
    actor U as User
    participant API as /api/communities/join-by-code
    participant S as joinCommunityByCode()
    participant DB as PostgreSQL

    U->>API: POST { code }
    API->>S: (userId, code)
    S->>DB: tìm community theo inviteCode
    alt code sai
        DB-->>S: null
        S-->>U: 404 Invalid invite code
    else đã là thành viên
        S->>DB: membership tồn tại?
        S-->>U: { joined: true } (idempotent)
    else hợp lệ
        S->>DB: đếm số nhóm < 20?
        S->>DB: tạo membership (role MEMBER)
        S->>DB: memberCount += 1
        S->>DB: fanout listing nhóm vào feed user
        S-->>U: { joined, communityId }
    end
```

### Flow 2: Đăng bài (kèm điểm + notification)

Đây là flow điển hình cho thấy 3 việc xảy ra **trong cùng 1 transaction**:

```mermaid
sequenceDiagram
    actor U as Member
    participant S as createCommunityPost()
    participant DB as PostgreSQL
    participant N as dispatchNotifications

    U->>S: { title, body, isPinned }
    S->>DB: kiểm tra membership (hoặc owner/admin)
    opt isPinned = true
        S->>S: assertCommunityMod (chỉ mod được ghim)
    end
    S->>DB: tạo CommunityPost
    S->>DB: communityPoints += 5 (cho tác giả)
    S->>DB: lấy danh sách userId thành viên
    S->>N: event community.post_created → tất cả member
    N->>DB: createMany Notification (trừ tác giả)
    S-->>U: post
```

### Quyền xóa bài / xóa listing (tính năng bổ sung gần đây)
- **Xóa post** (`deleteCommunityPost`): cho phép nếu `isAuthor || isMod` (mod = MODERATOR của nhóm, owner, hoặc ADMIN).
- **Xóa comment** (`deleteComment`): cùng quy tắc `isAuthor || isMod`, kèm `commentCount -= 1`.
- **Gỡ listing** (`listings/service.ts → deleteListing`): cho phép nếu là chủ listing, ADMIN, owner nhóm, hoặc MODERATOR nhóm; đặt status `REMOVED` và hủy các transaction PENDING.

### Bộ đếm denormalized
Mỗi thao tác thay đổi quan hệ con phải sửa bộ đếm tương ứng **trong cùng transaction**:

| Thao tác | Ghi quan hệ | Cập nhật đếm |
|---|---|---|
| join / leave / remove member | `CommunityMembership` ± | `memberCount` ± 1 |
| like / unlike | `CommunityPostLike` ± | `likeCount` ± 1, `communityPoints` ± 2 |
| comment / xóa comment | `CommunityPostComment` ± | `commentCount` ± 1, `communityPoints` + 3 |
| đăng bài | `CommunityPost` + | `communityPoints` + 5 |

> Vì bộ đếm là denormalized, nếu một thao tác ghi quan hệ mà quên cập nhật đếm (hoặc làm ngoài transaction) thì số liệu sẽ lệch. Đây là điểm dễ sinh bug nhất của module này.
