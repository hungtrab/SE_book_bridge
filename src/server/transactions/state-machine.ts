// =============================================================================
// state-machine.ts — MÁY TRẠNG THÁI (FSM) cho một giao dịch (Transaction)
// -----------------------------------------------------------------------------
// Đây là "phần khó" của Role #4. Toàn bộ quy tắc "từ trạng thái A, hành động X
// có hợp lệ không, và nếu hợp lệ thì sang trạng thái nào + kéo theo việc gì"
// đều nằm gọn trong hàm `transition()` thuần (pure function) dưới đây.
//
// VÌ SAO TÁCH RIÊNG KHỎI PRISMA / DATABASE:
//   - Đây là hàm THUẦN: cùng input -> luôn cùng output, KHÔNG đụng DB, KHÔNG
//     có side-effect thật. Nhờ vậy test được toàn bộ luồng mà không cần DB
//     (xem tests/transactions/state-machine.test.ts, chạy ~0ms).
//   - Module sở hữu (src/server/transactions/service.ts) mới là nơi: đọc row
//     từ DB -> gọi transition(trạng_thái_hiện_tại, hành_động) -> nếu ok thì
//     ghi trạng thái mới + thực thi các "side-effect" trả về (trong 1 Prisma
//     $transaction để đảm bảo tính nguyên tử).
//
// 8 TRẠNG THÁI: PENDING -> ACCEPTED -> IN_DELIVERY -> COMPLETED là luồng chính
// ("happy path"); DECLINED / WAITLISTED / CANCELLED / DISPUTED là các nhánh phụ.
// =============================================================================

import type { TransactionStatus, UserRole } from "@prisma/client";

// Các HÀNH ĐỘNG có thể tác động lên 1 giao dịch. Mỗi action ghi kèm `actor`
// (ai được phép làm) để FSM tự kiểm tra quyền — tránh việc requester tự "accept".
export type TxnAction =
  | { kind: "accept";   actor: "owner" }                          // chủ sách đồng ý cho
  | { kind: "decline";  actor: "owner" }                          // chủ sách từ chối
  | { kind: "cancel";   actor: "owner" | "requester" }            // 1 trong 2 bên huỷ
  | { kind: "ship";     actor: "owner" }                          // chủ sách đã gửi/giao
  | { kind: "complete"; actor: "requester" | "system" }           // người nhận xác nhận, HOẶC hệ thống tự complete sau 21 ngày
  | { kind: "rate";     actor: "owner" | "requester" }            // đánh giá sao (không đổi trạng thái)
  | { kind: "dispute";  actor: "owner" | "requester" }            // mở tranh chấp
  | { kind: "moderate-resolve"; actor: "moderator" }              // mod xử tranh chấp: cho qua
  | { kind: "moderate-reject";  actor: "moderator" };             // mod xử tranh chấp: huỷ

// Kết quả khi hỏi FSM "trạng thái này có cho phép hành động kia không?".
// ok=true  -> kèm trạng thái kế tiếp + danh sách side-effect caller phải làm.
// ok=false -> kèm lý do (route handler trả về lỗi 400/409 cho client).
export type TxnTransition =
  | { ok: true;  next: TransactionStatus; sideEffects: SideEffect[] }
  | { ok: false; reason: string };

// "SIDE-EFFECT" = mô tả CẦN LÀM GÌ kèm theo việc đổi trạng thái, dưới dạng dữ
// liệu thuần (không phải gọi hàm thật). service.ts đọc danh sách này rồi mới
// thực thi thật (đổi trạng thái listing, cộng/trừ điểm uy tín, gửi thông báo,
// đặt lịch nhắc...). Tách như vậy để FSM vẫn "thuần" và test được.
export type SideEffect =
  | { kind: "notify"; userKey: "owner" | "requester"; event: string }                   // gửi thông báo cho ai, sự kiện gì
  | { kind: "listing-status"; status: "RESERVED" | "ACTIVE" | "COMPLETED" }              // đổi trạng thái tin đăng sách
  | { kind: "reputation"; userKey: "owner" | "requester"; delta: number; reason: string }// cộng/trừ điểm uy tín
  | { kind: "schedule-reminder"; days: number };                                          // đặt lịch nhắc sau N ngày

// Hằng số tên trạng thái — gom 1 chỗ để tránh gõ sai chuỗi rải rác trong code.
// `satisfies Record<string, TransactionStatus>` bắt TypeScript kiểm tra mọi
// giá trị phải đúng là 1 TransactionStatus hợp lệ trong schema Prisma.
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
 * transition() — TRÁI TIM của Role #4.
 * Quyết định: ở trạng thái `current`, hành động `action` có hợp lệ không; nếu
 * có thì trả về trạng thái kế tiếp + các side-effect mà caller phải áp dụng.
 *
 * Mẫu chung của mỗi `case`:
 *   1) Kiểm tra ĐÚNG NGƯỜI làm (actor) — sai thì deny().
 *   2) Kiểm tra ĐÚNG TRẠNG THÁI nguồn — sai thì deny() (chặn chuyển trạng thái bất hợp lệ).
 *   3) ok(trạng_thái_mới, [danh sách side-effect]).
 */
export function transition(
  current: TransactionStatus,
  action: TxnAction,
): TxnTransition {
  switch (action.kind) {
    // ----- ACCEPT: chủ sách đồng ý yêu cầu -> giữ chỗ sách + báo người yêu cầu
    case "accept":
      if (action.actor !== "owner")
        return deny("Only the listing owner can accept a request"); // chỉ chủ sách được accept
      if (current !== T.PENDING)
        return deny(`Cannot accept a transaction in ${current}`);   // chỉ accept được khi đang PENDING
      return ok(T.ACCEPTED, [
        { kind: "listing-status", status: "RESERVED" },             // sách chuyển sang "đã giữ chỗ"
        { kind: "notify",         userKey: "requester", event: "accepted" }, // báo người yêu cầu
      ]);

    // ----- DECLINE: chủ sách từ chối yêu cầu
    case "decline":
      if (action.actor !== "owner")
        return deny("Only the owner can decline a request");
      if (current !== T.PENDING)
        return deny(`Cannot decline in ${current}`);
      return ok(T.DECLINED, [
        { kind: "notify", userKey: "requester", event: "declined" },
      ]);

    // ----- CANCEL: 1 trong 2 bên huỷ khi đang PENDING hoặc ACCEPTED
    case "cancel":
      if (current !== T.PENDING && current !== T.ACCEPTED)
        return deny(`Cannot cancel in ${current}`);                 // chỉ huỷ được trước khi giao hàng
      return ok(T.CANCELLED, [
        { kind: "listing-status", status: "ACTIVE" },               // trả sách về "đang mở" để người khác xin
        // Trừ nhẹ điểm uy tín BÊN HUỶ (để hạn chế huỷ kèo bừa).
        { kind: "reputation",
          userKey: action.actor === "owner" ? "owner" : "requester",
          delta: -3,
          reason: "transaction_cancelled" },
        // Báo cho BÊN CÒN LẠI biết kèo đã bị huỷ.
        { kind: "notify",
          userKey: action.actor === "owner" ? "requester" : "owner",
          event: "cancelled" },
      ]);

    // ----- SHIP: chủ sách báo đã gửi -> bắt đầu đếm giờ giao hàng
    case "ship":
      if (action.actor !== "owner")
        return deny("Only the owner can mark as shipped");
      if (current !== T.ACCEPTED)
        return deny(`Cannot ship in ${current}`);
      return ok(T.IN_DELIVERY, [
        { kind: "schedule-reminder", days: 14 },                    // 14 ngày sau sẽ nhắc xác nhận
        { kind: "notify", userKey: "requester", event: "shipped" },
      ]);

    // ----- COMPLETE: người nhận xác nhận đã nhận, HOẶC hệ thống tự complete sau 21 ngày
    case "complete":
      if (current !== T.IN_DELIVERY)
        return deny(`Cannot complete in ${current}`);               // chỉ hoàn tất từ trạng thái đang giao
      return ok(T.COMPLETED, [
        { kind: "listing-status", status: "COMPLETED" },            // sách đã trao xong
        // Cộng +10 điểm uy tín cho CẢ HAI bên khi giao dịch thành công.
        { kind: "reputation", userKey: "owner",     delta: 10, reason: "transaction_completed" },
        { kind: "reputation", userKey: "requester", delta: 10, reason: "transaction_completed" },
        { kind: "notify", userKey: "owner",     event: "completed" },
        { kind: "notify", userKey: "requester", event: "completed" },
      ]);

    // ----- RATE: đánh giá sao sau khi đã COMPLETED. KHÔNG đổi trạng thái.
    case "rate":
      if (current !== T.COMPLETED)
        return deny("Can only rate a completed transaction");
      return ok(T.COMPLETED, []);   // giữ nguyên COMPLETED; việc lưu Rating do ratings.ts xử lý riêng

    // ----- DISPUTE: 1 trong 2 bên mở tranh chấp (khi đang giao hoặc đã hoàn tất)
    case "dispute":
      if (current !== T.IN_DELIVERY && current !== T.COMPLETED)
        return deny(`Cannot dispute in ${current}`);
      return ok(T.DISPUTED, [
        { kind: "notify", userKey: "owner",     event: "disputed" },
        { kind: "notify", userKey: "requester", event: "disputed" },
      ]);

    // ----- MODERATE-RESOLVE: mod xử tranh chấp theo hướng "cho qua" -> COMPLETED
    case "moderate-resolve":
      if (current !== T.DISPUTED)
        return deny("Can only resolve a dispute from DISPUTED");    // chỉ xử được khi đang DISPUTED
      return ok(T.COMPLETED, [
        { kind: "listing-status", status: "COMPLETED" },
        { kind: "notify", userKey: "owner",     event: "dispute_resolved" },
        { kind: "notify", userKey: "requester", event: "dispute_resolved" },
      ]);

    // ----- MODERATE-REJECT: mod xử tranh chấp theo hướng "huỷ kèo" -> CANCELLED
    case "moderate-reject":
      if (current !== T.DISPUTED)
        return deny("Can only reject a dispute from DISPUTED");
      return ok(T.CANCELLED, [
        { kind: "listing-status", status: "ACTIVE" },               // trả sách về "đang mở"
        { kind: "notify", userKey: "owner",     event: "dispute_rejected" },
        { kind: "notify", userKey: "requester", event: "dispute_rejected" },
      ]);
  }
}

// Hàm tiện ích gói kết quả "hợp lệ" cho gọn (đỡ lặp { ok: true, ... }).
function ok(next: TransactionStatus, sideEffects: SideEffect[]): TxnTransition {
  return { ok: true, next, sideEffects };
}

// Hàm tiện ích gói kết quả "bị từ chối" kèm lý do để trả lỗi cho client.
function deny(reason: string): TxnTransition {
  return { ok: false, reason };
}

/**
 * actorRoleAllowed() — kiểm tra QUYỀN THEO ROLE (RBAC) ở tầng route, để loại
 * sớm request không đủ quyền TRƯỚC KHI gọi vào FSM.
 *   - Hành động kiểm duyệt (moderate-*) chỉ MODERATOR / ADMIN được làm.
 *   - Các hành động còn lại: USER thường (hoặc cao hơn) đều được — việc kiểm
 *     "đúng owner hay đúng requester" thì FSM ở trên đã lo qua trường `actor`.
 */
export function actorRoleAllowed(action: TxnAction["kind"], role: UserRole): boolean {
  if (action === "moderate-resolve" || action === "moderate-reject")
    return role === "MODERATOR" || role === "ADMIN";
  return role === "USER" || role === "MODERATOR" || role === "ADMIN";
}
