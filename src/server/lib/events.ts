// =============================================================================
// events.ts — HỢP ĐỒNG (contract) CỦA EVENT BUS — do Role #4 (DevOps/infra) giữ
// -----------------------------------------------------------------------------
// Đây là "ngôn ngữ chung" để các module nói chuyện với nhau MÀ KHÔNG gọi trực
// tiếp Prisma/hàm của nhau. Một module khi làm xong việc sẽ `emit` một
// DomainEvent; các module khác (đặc biệt là dispatcher thông báo của Role #1,
// xem notifications/dispatcher.ts) `subscribe` và phản ứng.
//
// `DomainEvent` là 1 "discriminated union": mọi biến thể đều có trường `kind`
// để TypeScript (và code) biết đang xử lý sự kiện loại nào. Quy ước chung:
//   - `actorId`     : ID người GÂY RA sự kiện (để không tự gửi thông báo cho mình).
//   - `recipientIds`: danh sách người liên quan đã tính sẵn (khi cần gửi cho nhiều người).
//
// ⚠️ ĐÂY LÀ CONTRACT: khoá kiểu từ tuần 2. Sửa/bớt field ở đây có thể làm hỏng
// nhiều module cùng lúc -> mọi thay đổi phải báo cả nhóm + qua DevOps lead (#4).
// =============================================================================

export type DomainEvent =
  // Có tin đăng sách MỚI -> báo người theo dõi (followerIds) + thành viên cộng đồng.
  | {
      kind: "listing.created";
      actorId: string;            // người đăng tin
      listingId: string;
      title: string;
      followerIds: string[];      // những người đang theo dõi người đăng
      communityMemberIds: string[]; // thành viên cộng đồng mà tin thuộc về
    }
  // Có người GỬI YÊU CẦU xin sách -> báo cho chủ sách.
  | {
      kind: "transaction.requested";
      actorId: string;            // người xin sách (requester)
      transactionId: string;
      listingId: string;
      title: string;
      ownerId: string;            // chủ sách (người sẽ nhận thông báo)
      requesterId: string;
    }
  // Giao dịch ĐỔI TRẠNG THÁI (accept/ship/complete/dispute...) -> báo người liên quan.
  | {
      kind: "transaction.status_changed";
      actorId: string;
      transactionId: string;
      recipientIds: string[];     // những ai cần biết về thay đổi này
      status: string;             // trạng thái mới (chuỗi TransactionStatus)
    }
  // Có TIN NHẮN mới trong hội thoại -> báo người nhận.
  | {
      kind: "message.created";
      actorId: string;            // người gửi
      conversationId: string;
      messageId: string;
      recipientId: string;        // người nhận (bên còn lại của hội thoại)
    }
  // THÔNG BÁO chính thức của 1 cộng đồng -> gửi mọi thành viên.
  | {
      kind: "community.announcement";
      actorId: string;
      communityId: string;
      recipientIds: string[];
      title: string;
    }
  // User LÊN/XUỐNG HẠNG uy tín -> báo cho chính chủ.
  | {
      kind: "reputation.tier_changed";
      actorId: string;
      userId: string;             // người đổi hạng
      tier: string;               // hạng mới
    }
  // Có HÀNH ĐỘNG KIỂM DUYỆT áp lên 1 user -> báo người bị xử.
  | {
      kind: "moderation.action";
      actorId: string;            // moderator
      userId: string;             // người bị xử lý
      reportId: string;
      action: string;             // loại hành động (warn/remove/suspend...)
    }
  // BÀI ĐĂNG cộng đồng mới -> báo thành viên.
  | {
      kind: "community.post_created";
      actorId: string;            // tác giả bài
      communityId: string;
      communityName: string;
      postId: string;
      postTitle: string;
      recipientIds: string[];
    }
  // Có người THẢ CẢM XÚC (like/react) lên bài -> báo tác giả bài.
  | {
      kind: "community.post_liked";
      actorId: string;            // người like
      communityId: string;
      postId: string;
      postTitle: string;
      authorId: string;           // tác giả bài (người nhận thông báo)
    }
  // Có người BÌNH LUẬN bài -> báo tác giả bài.
  | {
      kind: "community.post_commented";
      actorId: string;            // người bình luận
      postId: string;
      postTitle: string;
      communityId: string;
      authorId: string;           // tác giả bài (người nhận thông báo)
      commentId: string;
    };
