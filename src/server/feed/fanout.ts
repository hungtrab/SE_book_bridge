// =============================================================================
// fanout.ts — "PHÁT TÁN" tin đăng vào bảng tin cá nhân (feed) — Role #3
// -----------------------------------------------------------------------------
// "Fan-out on write": thay vì mỗi lần mở feed lại đi truy vấn tổng hợp (chậm),
// ta GHI SẴN các FeedItem cho từng user khi có sự kiện liên quan. Đọc feed sau
// đó chỉ là 1 query đơn giản theo userId -> nhanh.
//
// Hàm dưới đây dùng khi 1 user VỪA follow ai đó / VỪA tham gia 1 cộng đồng:
// ta "kéo ngược" tối đa 20 tin đăng ACTIVE gần nhất của nguồn đó vào feed của họ,
// để feed có nội dung ngay lập tức (không phải chờ tin mới).
// =============================================================================

import type { Prisma } from "@prisma/client";

/**
 * fanoutExistingListingsToUser() — đổ tin đăng SẴN CÓ của 1 nguồn vào feed của
 * `userId`.
 * @param tx     Prisma transaction client (chạy cùng transaction với hành động follow/join)
 * @param userId người sẽ nhận các FeedItem mới
 * @param source nguồn để lấy tin: theo người được follow (followeeId) HOẶC theo cộng đồng (communityId)
 */
export async function fanoutExistingListingsToUser(
  tx: Prisma.TransactionClient,
  userId: string,
  source: { followeeId?: string; communityId?: string },
) {
  // Lấy tối đa 20 tin ACTIVE mới nhất khớp nguồn. Spread có điều kiện (`...(cond ? {} : {})`)
  // để chỉ thêm filter ownerId/communityId khi nguồn tương ứng được truyền vào.
  const listings = await tx.listing.findMany({
    where: {
      status: "ACTIVE",                                                  // chỉ tin còn hiệu lực
      ...(source.followeeId ? { ownerId: source.followeeId } : {}),      // nếu follow người -> lọc theo chủ tin
      ...(source.communityId ? { communityId: source.communityId } : {}),// nếu join nhóm -> lọc theo cộng đồng
    },
    orderBy: { createdAt: "desc" },     // mới nhất trước
    take: 20,                           // giới hạn 20 để không phình feed
    select: {                           // chỉ lấy đúng field cần đóng gói vào payload
      id: true,
      ownerId: true,
      title: true,
      author: true,
      genre: true,
      transactionType: true,
      communityId: true,
      createdAt: true,
    },
  });
  if (listings.length === 0) return { count: 0 };   // nguồn chưa có tin nào -> khỏi ghi

  // Tạo hàng loạt FeedItem (1 dòng / tin). `payload` lưu sẵn dữ liệu hiển thị
  // (dạng JSON) để feed render mà không cần join lại bảng Listing.
  return tx.feedItem.createMany({
    data: listings.map((listing) => ({
      userId,
      listingId: listing.id,
      kind: "new_listing",
      createdAt: listing.createdAt,     // giữ thời điểm gốc của tin để feed sắp đúng thứ tự thời gian
      payload: {
        event: "listing.created",
        listingId: listing.id,
        ownerId: listing.ownerId,
        title: listing.title,
        author: listing.author,
        genre: listing.genre,
        transactionType: listing.transactionType,
        communityId: listing.communityId,
        // Ghi LÝ DO xuất hiện trong feed (để UI hiện "vì bạn theo dõi..." / "vì bạn ở cộng đồng...").
        reasons: [source.followeeId ? "followed_owner" : "community"],
      },
    })),
    skipDuplicates: true,   // tránh tạo trùng nếu tin đã có sẵn trong feed (nhờ unique constraint)
  });
}
