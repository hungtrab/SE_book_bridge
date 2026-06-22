// =============================================================================
// dispatcher.ts — BỘ ĐỊNH TUYẾN THÔNG BÁO (notification dispatcher)
// -----------------------------------------------------------------------------
// "Phần khó" của Role #1 (Notifications). Đây là nơi DUY NHẤT trả lời câu hỏi:
// "khi 1 sự kiện (DomainEvent) xảy ra ở bất kỳ module nào, thì AI cần được báo
//  và báo bằng LOẠI thông báo gì?".
//
// CÁCH HOẠT ĐỘNG: mọi module khác `emit` 1 DomainEvent (định nghĩa kiểu trong
// src/server/lib/events.ts — do Role #4 giữ contract). Hàm notificationTargets()
// nhận event đó, dựa vào `event.kind` để map ra DANH SÁCH người nhận + loại
// thông báo. Đây là mẫu "event.kind -> recipients[]".
//
// LƯU Ý QUAN TRỌNG: luôn KHÔNG tự báo cho chính người gây ra sự kiện (actorId) —
// ví dụ bạn tự bình luận bài mình thì không cần thông báo cho chính bạn.
// notificationTargets() là HÀM THUẦN nên test fan-out cực dễ.
// =============================================================================

import type { NotificationKind, Prisma } from "@prisma/client";

import type { DomainEvent } from "../lib/events";

// 1 "mục tiêu" = 1 dòng Notification sẽ được tạo: gửi cho `userId`, loại `kind`,
// kèm `payload` (chính là event gốc, lưu dạng JSON để client hiển thị chi tiết).
export type NotificationTarget = {
  userId: string;
  kind: NotificationKind;
  payload: Prisma.InputJsonValue;
};

/**
 * notificationTargets() — TRÁI TIM của dispatcher.
 * Nhận 1 DomainEvent -> trả về danh sách người cần nhận thông báo.
 * Mỗi `case` xử lý 1 loại sự kiện. Một số sự kiện gửi cho NHIỀU người
 * (followers / thành viên cộng đồng), số khác chỉ gửi cho 1 người.
 */
export function notificationTargets(event: DomainEvent): NotificationTarget[] {
  switch (event.kind) {
    // Tin đăng mới: báo cho (a) người theo dõi chủ tin, (b) thành viên cộng đồng.
    case "listing.created":
      return uniqueTargets([
        ...event.followerIds.map((userId) => ({
          userId,
          kind: "NEW_LISTING_FROM_FOLLOWED" as const,
          payload: event,
        })),
        ...event.communityMemberIds.map((userId) => ({
          userId,
          kind: "COMMUNITY_ANNOUNCEMENT" as const,
          payload: event,
        })),
      ], event.actorId);   // lọc bỏ chính người đăng

    // Có người xin sách: chỉ báo cho CHỦ sách (trừ khi chủ tự xin sách mình -> bỏ).
    case "transaction.requested":
      return event.ownerId === event.actorId
        ? []
        : [{
            userId: event.ownerId,
            kind: "TRANSACTION_STATUS_CHANGED",
            payload: event,
          }];

    // Giao dịch đổi trạng thái (accept/ship/complete...): báo cho danh sách
    // người liên quan mà state-machine/service đã tính sẵn (recipientIds).
    case "transaction.status_changed":
      return uniqueTargets(event.recipientIds.map((userId) => ({
        userId,
        kind: "TRANSACTION_STATUS_CHANGED" as const,
        payload: event,
      })), event.actorId);

    // Tin nhắn mới: chỉ báo cho người nhận (không báo người gửi).
    case "message.created":
      return event.recipientId === event.actorId
        ? []
        : [{ userId: event.recipientId, kind: "NEW_MESSAGE", payload: event }];

    // Thông báo của cộng đồng: gửi cho mọi thành viên (trừ người đăng).
    case "community.announcement":
      return uniqueTargets(event.recipientIds.map((userId) => ({
        userId,
        kind: "COMMUNITY_ANNOUNCEMENT" as const,
        payload: event,
      })), event.actorId);

    // Lên hạng uy tín: báo cho chính chủ (đây là tin vui về bản thân nên không lọc actor).
    case "reputation.tier_changed":
      return [{ userId: event.userId, kind: "REPUTATION_TIER_CHANGED", payload: event }];

    // Bị xử lý kiểm duyệt: báo cho người bị xử (trừ khi tự thao tác trên mình).
    case "moderation.action":
      return event.userId === event.actorId
        ? []
        : [{ userId: event.userId, kind: "MODERATION_ACTION", payload: event }];

    // Bài cộng đồng mới: báo cho thành viên (trừ tác giả).
    case "community.post_created":
      return uniqueTargets(event.recipientIds.map((userId) => ({
        userId,
        kind: "COMMUNITY_POST_CREATED" as const,
        payload: event,
      })), event.actorId);

    // Có người thả cảm xúc bài: chỉ báo tác giả (trừ khi tự like bài mình).
    case "community.post_liked":
      return event.authorId === event.actorId
        ? []
        : [{ userId: event.authorId, kind: "COMMUNITY_POST_LIKED" as const, payload: event }];

    // Có người bình luận bài: chỉ báo tác giả (trừ khi tự bình luận bài mình).
    case "community.post_commented":
      return event.authorId === event.actorId
        ? []
        : [{ userId: event.authorId, kind: "COMMUNITY_POST_COMMENTED" as const, payload: event }];
  }
}

/**
 * dispatchNotifications() — phần CÓ side-effect: lấy danh sách target rồi GHI
 * thật vào bảng Notification. Nhận `tx` (Prisma transaction client) để việc tạo
 * thông báo nằm CÙNG transaction với nghiệp vụ gốc -> hoặc cùng thành công, hoặc
 * cùng rollback (tránh "đã báo nhưng nghiệp vụ chưa xảy ra").
 */
export async function dispatchNotifications(tx: Prisma.TransactionClient, event: DomainEvent) {
  const targets = notificationTargets(event);
  if (targets.length === 0) return { count: 0 };          // không ai cần báo -> thôi
  const result = await tx.notification.createMany({ data: targets });
  return { count: result.count };
}

/**
 * uniqueTargets() — lọc danh sách target:
 *   - BỎ chính người gây sự kiện (actorId) — không tự báo cho mình.
 *   - BỎ trùng theo cặp (userId + kind) — 1 người không nhận 2 thông báo y hệt
 *     (ví dụ vừa follow chủ tin VỪA cùng cộng đồng thì chỉ nhận 1).
 */
function uniqueTargets(targets: NotificationTarget[], actorId: string): NotificationTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.userId}:${target.kind}`;
    if (target.userId === actorId || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
