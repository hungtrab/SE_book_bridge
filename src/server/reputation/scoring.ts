// =============================================================================
// scoring.ts — QUY TẮC TÍNH ĐIỂM UY TÍN (reputation) — "phần khó" của Role #5
// -----------------------------------------------------------------------------
// Điểm uy tín của 1 user = TỔNG các `delta` của mọi dòng `ReputationEvent` của
// user đó (mỗi sự kiện tốt/xấu cộng/trừ 1 ít). `User.reputationScore` trong DB
// chỉ là BẢN CACHE được tính sẵn cho đọc nhanh; nguồn sự thật là bảng
// ReputationEvent — có thể tính lại bất cứ lúc nào từ các sự kiện.
//
// HẠNG (tier) suy ra THUẦN TÚY từ điểm (theo bảng trong SRS §07):
//   New Member          0–19
//   Active Sharer      20–49
//   Trusted Contributor 50–79
//   Community Champion  80–100
// Điểm âm bị kẹp về 0 khi gắn nhãn hạng (SRS không định nghĩa hành vi điểm âm —
// việc xử lý tài khoản xấu giao cho hàng đợi kiểm duyệt / moderation).
//
// File này là LOGIC THUẦN (không đụng DB) nên test được trực tiếp (16 test).
// Trọng số để lộ ra ngoài (export) để cả nhóm chỉnh số sau này mà không phải
// sửa nơi gọi.
// =============================================================================

// Bảng TRỌNG SỐ: mỗi loại sự kiện cộng/trừ bao nhiêu điểm. Đổi số ở đây là
// đổi toàn hệ thống. (Số dương = thưởng, số âm = phạt.)
export const ReputationWeights = {
  TRANSACTION_COMPLETED:     10,    // hoàn tất 1 giao dịch: +10
  RATING_FIVE_STAR:           5,    // bị/được đánh giá 5 sao: +5
  RATING_FOUR_STAR:           3,    // 4 sao: +3
  RATING_THREE_STAR:          0,    // 3 sao: trung tính
  RATING_TWO_STAR:           -3,    // 2 sao: -3
  RATING_ONE_STAR:           -5,    // 1 sao: -5
  REPORT_UPHELD:            -15,    // bị báo cáo và mod xử là ĐÚNG: phạt nặng -15
  CANCELLATION:              -3,    // huỷ kèo: -3 (khớp với side-effect trong state-machine.ts)
  COMMUNITY_CONTRIBUTION:    +5,    // đóng góp cho cộng đồng: +5
  TIME_DECAY_PER_30_DAYS:    -1,    // "phân rã theo thời gian": -1 mỗi 30 ngày, do 1 cron job chạy hằng ngày
} as const;

// 4 hạng uy tín (dùng key ngắn trong code; nhãn hiển thị xem tierLabel()).
export type ReputationTier = "new" | "active" | "trusted" | "champion";

/**
 * tierForScore() — đổi từ ĐIỂM SỐ sang HẠNG.
 * Bước 1: kẹp điểm vào [0, 100] (clamp) — điểm âm coi như 0, trên 100 coi như 100.
 * Bước 2: so với các mốc 20 / 50 / 80 để ra hạng.
 */
export function tierForScore(score: number): ReputationTier {
  const s = Math.max(0, Math.min(100, score));   // kẹp về khoảng [0,100]
  if (s < 20)  return "new";                      // 0–19
  if (s < 50)  return "active";                   // 20–49
  if (s < 80)  return "trusted";                  // 50–79
  return "champion";                              // 80–100
}

// Đổi key hạng sang NHÃN hiển thị cho người dùng (badge trên profile/listing).
export function tierLabel(tier: ReputationTier): string {
  switch (tier) {
    case "new":      return "New Member";
    case "active":   return "Active Sharer";
    case "trusted":  return "Trusted Contributor";
    case "champion": return "Community Champion";
  }
}

/**
 * deltaForRating() — số sao (1–5) -> số điểm cộng/trừ tương ứng.
 * Tách riêng để khi ai đó đánh giá sao, ta biết ghi ReputationEvent với delta nào.
 */
export function deltaForRating(stars: 1 | 2 | 3 | 4 | 5): number {
  switch (stars) {
    case 5: return ReputationWeights.RATING_FIVE_STAR;
    case 4: return ReputationWeights.RATING_FOUR_STAR;
    case 3: return ReputationWeights.RATING_THREE_STAR;
    case 2: return ReputationWeights.RATING_TWO_STAR;
    case 1: return ReputationWeights.RATING_ONE_STAR;
  }
}
