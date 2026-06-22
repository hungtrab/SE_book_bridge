// =============================================================================
// anti-gaming.ts — PHÁT HIỆN GIAN LẬN ĐIỂM UY TÍN (chống "cày điểm")
// -----------------------------------------------------------------------------
// "Phần khó" nhất của Role #5: dùng thuật toán đồ thị để bắt các tài khoản tự
// giao dịch lẫn nhau nhằm thổi phồng điểm uy tín. Mô hình hoá: mỗi user là 1
// ĐỈNH, mỗi giao dịch hoàn tất là 1 CẠNH nối 2 người. Ta soi cấu trúc đồ thị này.
//
// QUAN TRỌNG: tất cả chỉ là HÀM THUẦN (không đụng DB) -> test cực dễ, và KHÔNG
// tự động khoá tài khoản — chỉ trả về danh sách "đáng ngờ" để đẩy vào hàng đợi
// cho moderator xem (vì có thể dương tính giả: 2 bạn thân thật cũng hay trao đổi).
//
// 3 HEURISTIC (luật phỏng đoán):
//   1. "Cặp đối ứng độc quyền" (reciprocal-only pair): A và B chỉ giao dịch với
//      DUY NHẤT nhau, qua lại để bơm điểm.
//   2. "Nhóm thông đồng khép kín" (closed collusion group): vòng 3–10 người chỉ
//      trao đổi nội bộ (A→B→C→A). Cặp 2 người là trường hợp đặc biệt đã do
//      heuristic 1 lo, ở đây bắt nhóm ≥3.
//   3. "Tài khoản ít đa dạng" (low-diversity): user có quá ít đối tác khác nhau
//      NHƯNG đã giao dịch đủ nhiều (chặn báo nhầm người mới chỉ mới 1–2 kèo).
// =============================================================================

// 1 giao dịch ĐÃ HOÀN TẤT, rút gọn về đúng thứ cần cho thuật toán: ai với ai.
export interface CompletedTxn {
  transactionId: string;
  ownerId: string;
  requesterId: string;
}

/**
 * findReciprocalOnlyPairs() — Heuristic 1: tìm các cặp (A,B) mà A chỉ từng giao
 * dịch với B và B cũng chỉ từng giao dịch với A.
 * Cách làm: dựng map "mỗi người -> tập đối tác", rồi tìm các đỉnh có đúng 1 đối
 * tác và đối tác đó cũng chỉ có đúng mình nó (đối ứng 2 chiều).
 */
export function findReciprocalOnlyPairs(
  transactions: CompletedTxn[],
): Array<[string, string]> {
  const counterparts = buildCounterpartMap(transactions);   // user -> {các đối tác}
  const pairs: Array<[string, string]> = [];
  for (const [user, partners] of counterparts.entries()) {
    if (partners.size === 1) {                               // user này chỉ có DUY NHẤT 1 đối tác
      const [other] = [...partners];                         // lấy ra người đó
      const otherPartners = counterparts.get(other);
      // Người kia cũng phải chỉ có 1 đối tác, và đó đúng là `user` -> đối ứng độc quyền
      if (otherPartners?.size === 1 && [...otherPartners][0] === user) {
        // Điều kiện `user < other` để mỗi cặp chỉ thêm 1 LẦN (tránh trùng (A,B) và (B,A)).
        if (user < other) pairs.push([user, other]);
      }
    }
  }
  return pairs;
}

/**
 * findCollusionGroups() — Heuristic 2: tìm các "nhóm khép kín" 3–maxGroupSize
 * người mà MỌI thành viên chỉ giao dịch với người trong nhóm.
 * Dùng BFS để gom thành phần liên thông, rồi kiểm tra tính "khép kín".
 * Trả về danh sách nhóm, mỗi nhóm là mảng userId đã sắp xếp.
 */
export function findCollusionGroups(
  transactions: CompletedTxn[],
  maxGroupSize = 10,
): string[][] {
  const counterparts = buildCounterpartMap(transactions);
  const groups: string[][] = [];
  const visited = new Set<string>();   // đỉnh đã xét, tránh lặp lại

  for (const [user] of counterparts.entries()) {
    if (visited.has(user)) continue;

    // --- BFS (loang theo chiều rộng): từ `user`, gom hết những ai nối tới được
    // vào tập `candidate` (chính là 1 thành phần liên thông của đồ thị).
    const candidate = new Set<string>([user]);
    const queue = [user];
    while (queue.length) {
      const current = queue.shift()!;                         // lấy đỉnh đầu hàng đợi
      for (const partner of counterparts.get(current) ?? []) {
        if (!candidate.has(partner)) {                        // đối tác chưa nằm trong nhóm
          candidate.add(partner);
          queue.push(partner);                                // đưa vào hàng đợi để loang tiếp
        }
      }
    }

    // Chỉ quan tâm nhóm cỡ 3..maxGroupSize (cặp 2 người đã có heuristic 1 lo;
    // nhóm quá lớn thì khả năng là cộng đồng thật, không phải thông đồng).
    if (candidate.size < 3 || candidate.size > maxGroupSize) continue;

    // --- Kiểm tra KHÉP KÍN: mọi thành viên phải thoả 2 điều kiện
    const isClosed = [...candidate].every((member) => {
      const memberPartners = counterparts.get(member) ?? new Set<string>();
      // (a) TẤT CẢ đối tác đều nằm trong nhóm (không "ra ngoài" giao dịch với ai khác).
      const allInternal = [...memberPartners].every((p) => candidate.has(p));
      // (b) Phải nối với ≥2 người trong nhóm -> loại các "nút lá" của 1 chuỗi mở
      //     (ví dụ A-B-C-D thẳng hàng thì A,D chỉ có 1 nối nội bộ, không phải vòng kín).
      const internalDegree = [...memberPartners].filter((p) => candidate.has(p)).length;
      return allInternal && internalDegree >= 2;
    });

    if (isClosed) {
      const sorted = [...candidate].sort();
      groups.push(sorted);
      for (const u of candidate) visited.add(u);              // đánh dấu cả nhóm đã xét
    }
  }
  return groups;
}

/**
 * findLowDiversityUsers() — Heuristic 3: user có số đối tác KHÁC NHAU dưới ngưỡng
 * NHƯNG đã giao dịch đủ nhiều (≥ minTransactions).
 * `minTransactions = 3` để KHÔNG báo nhầm người mới chân ướt chân ráo (1–2 kèo
 * đầu thì hiển nhiên ít đối tác).
 */
export function findLowDiversityUsers(
  transactions: CompletedTxn[],
  threshold = 2,            // ngưỡng số đối tác khác nhau tối thiểu "lành mạnh"
  minTransactions = 3,      // phải có ít nhất ngần này giao dịch mới bị xét
): string[] {
  const counterparts = new Map<string, Set<string>>();   // user -> {đối tác khác nhau}
  const txnCount = new Map<string, number>();             // user -> tổng số lần giao dịch

  for (const t of transactions) {
    if (t.ownerId === t.requesterId) continue;            // bỏ qua dữ liệu lỗi (tự giao với mình)
    // Đếm 2 chiều: cả owner lẫn requester đều "có thêm 1 đối tác + 1 giao dịch".
    for (const [me, them] of [[t.ownerId, t.requesterId], [t.requesterId, t.ownerId]] as const) {
      if (!counterparts.has(me)) counterparts.set(me, new Set());
      counterparts.get(me)!.add(them);                    // Set tự loại trùng -> đếm đối tác KHÁC NHAU
      txnCount.set(me, (txnCount.get(me) ?? 0) + 1);      // tổng số giao dịch (kể cả lặp với cùng người)
    }
  }

  const flagged: string[] = [];
  for (const [user, partners] of counterparts.entries()) {
    const count = txnCount.get(user) ?? 0;
    // Giao dịch nhiều (count ≥ min) mà chỉ quanh quẩn vài người (partners < threshold) -> đáng ngờ.
    if (count >= minTransactions && partners.size > 0 && partners.size < threshold) {
      flagged.push(user);
    }
  }
  return flagged;
}

/**
 * buildCounterpartMap() — hàm dựng đồ thị dùng chung cho heuristic 1 & 2:
 * trả về Map "mỗi user -> tập những người đã từng giao dịch cùng".
 * Cạnh là VÔ HƯỚNG nên thêm cả 2 chiều (owner↔requester).
 */
function buildCounterpartMap(transactions: CompletedTxn[]): Map<string, Set<string>> {
  const counterparts = new Map<string, Set<string>>();
  for (const t of transactions) {
    if (t.ownerId === t.requesterId) continue;            // bỏ dữ liệu lỗi
    for (const [me, them] of [[t.ownerId, t.requesterId], [t.requesterId, t.ownerId]] as const) {
      if (!counterparts.has(me)) counterparts.set(me, new Set());
      counterparts.get(me)!.add(them);
    }
  }
  return counterparts;
}
