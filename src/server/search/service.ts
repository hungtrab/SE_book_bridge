// =============================================================================
// search/service.ts — TÌM KIẾM & XẾP HẠNG LIÊN QUAN (Role #3) — "phần khó"
// -----------------------------------------------------------------------------
// Tìm sách theo từ khoá + nhiều bộ lọc kết hợp, có CHẤM ĐIỂM LIÊN QUAN
// (relevance ranking) và PHÂN TRANG bằng cursor. Vì cần tính điểm linh hoạt,
// phần lõi dùng SQL thô (`$queryRaw`) thay vì query builder của Prisma.
//
// LUỒNG searchListings():
//   1) Chuẩn hoá input (Zod) + tách "cú pháp tìm kiếm" (vd: "author:harari fiction").
//   2) Dựng danh sách điều kiện WHERE động theo các filter có mặt.
//   3) Dựng biểu thức tính ĐIỂM (rank) — khớp ở title nặng hơn ở description...
//   4) Chạy SQL lấy danh sách id đã xếp hạng (lấy dư 1 để biết còn trang sau không).
//   5) "Hydrate": load đầy đủ Listing cho các id đó qua Prisma (kèm ảnh, owner...).
// =============================================================================

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { BOOK_CONDITIONS, TRANSACTION_TYPES } from "../listings/validation";
import { districtsWithinRadius } from "./districts";
import { parseSearchQuery } from "./query-parser";

// Schema kiểm tra & ép kiểu tham số tìm kiếm (từ query string của URL).
// `coerce` để biến chuỗi "20" trên URL thành số. pageSize tối đa 50, mặc định 20.
export const SearchSchema = z.object({
  q: z.string().trim().max(300).optional(),                          // từ khoá tự do
  genre: z.string().trim().min(1).max(64).optional(),
  author: z.string().trim().min(1).max(200).optional(),
  isbn: z.string().trim().min(1).max(20).optional(),
  condition: z.enum(BOOK_CONDITIONS).optional(),
  transactionType: z.enum(TRANSACTION_TYPES).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  communityId: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).max(120).optional(),
  cursor: z.string().optional(),                                     // con trỏ phân trang (offset đã mã hoá)
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchInput = z.infer<typeof SearchSchema>;

type RankedId = { id: string; rank: number };   // 1 dòng kết quả SQL: id + điểm liên quan
const LIKE_ESCAPE = "\\";                        // ký tự escape dùng trong mệnh đề ILIKE ... ESCAPE

export async function searchListings(input: SearchInput, viewerId?: string) {
  const data = SearchSchema.parse(input);
  // Tách từ khoá tự do thành phần TEXT + các filter nhúng trong cú pháp (vd "genre:fiction").
  const parsed = parseSearchQuery(data.q ?? "");
  const text = parsed.text;
  // Filter truyền thẳng (data.*) được ƯU TIÊN; nếu không có thì lấy filter tách từ cú pháp (parsed.*).
  const genre = data.genre ?? parsed.filters.genre;
  const author = data.author ?? parsed.filters.author;
  const isbn = (data.isbn ?? parsed.filters.isbn)?.replace(/[-\s]/g, "").toUpperCase(); // chuẩn hoá ISBN: bỏ gạch/space, in hoa
  const condition = validCondition(data.condition ?? parsed.filters.condition);
  const transactionType = validType(data.transactionType ?? parsed.filters.type);
  const communityId = data.communityId ?? parsed.filters.community;
  const offset = decodeCursor(data.cursor);                          // giải mã con trỏ -> offset số
  const textPattern = text ? likePattern(text) : null;              // mẫu ILIKE "%abc%" (đã escape)
  const isbnPattern = text ? likePattern(text.replace(/[-\s]/g, "").toUpperCase()) : null;

  // --- Dựng các điều kiện WHERE động. Luôn có điều kiện "chỉ tin ACTIVE".
  const filters: Prisma.Sql[] = [Prisma.sql`l."status" = 'ACTIVE'::"ListingStatus"`];
  if (textPattern) {
    // Có từ khoá -> khớp ở nhiều cột (title/author/description/isbn/genre/tên cộng đồng).
    filters.push(Prisma.sql`(
      l."title" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE}
      OR l."author" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE}
      OR l."description" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE}
      OR l."isbn" ILIKE ${isbnPattern} ESCAPE ${LIKE_ESCAPE}
      OR l."genre" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE}
      OR c."name" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE}
    )`);
  }
  // Mỗi filter chỉ thêm vào WHERE khi người dùng có truyền (giao nhau bằng AND).
  if (genre) filters.push(Prisma.sql`LOWER(l."genre") = LOWER(${genre})`);
  if (author) filters.push(Prisma.sql`l."author" ILIKE ${likePattern(author)} ESCAPE ${LIKE_ESCAPE}`);
  if (isbn) filters.push(Prisma.sql`l."isbn" = ${isbn}`);
  if (condition) filters.push(Prisma.sql`l."condition" = ${condition}::"BookCondition"`);
  if (transactionType) filters.push(Prisma.sql`l."transactionType" = ${transactionType}::"TransactionType"`);
  if (data.maxPrice !== undefined) filters.push(Prisma.sql`COALESCE(l."askingPriceVnd", 0) <= ${data.maxPrice}`);
  if (communityId) filters.push(Prisma.sql`(l."communityId" = ${communityId} OR c."name" ILIKE ${likePattern(communityId)} ESCAPE ${LIKE_ESCAPE})`);

  // --- ĐIỂM LIÊN QUAN: khớp ở đâu thì cộng bấy nhiêu. title (8) > author/isbn (5)
  // > genre/community (3) > description (2). Không có từ khoá -> điểm 0 (sắp theo thời gian).
  const rank = textPattern
    ? Prisma.sql`(
        CASE WHEN l."title" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE} THEN 8 ELSE 0 END
        + CASE WHEN l."author" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE} THEN 5 ELSE 0 END
        + CASE WHEN l."isbn" ILIKE ${isbnPattern} ESCAPE ${LIKE_ESCAPE} THEN 5 ELSE 0 END
        + CASE WHEN l."genre" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE} THEN 3 ELSE 0 END
        + CASE WHEN c."name" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE} THEN 3 ELSE 0 END
        + CASE WHEN l."description" ILIKE ${textPattern} ESCAPE ${LIKE_ESCAPE} THEN 2 ELSE 0 END
      )::real`
    : Prisma.sql`0::real`;
  // Chạy SQL: lấy id + điểm, sắp theo điểm giảm dần rồi mới nhất. LIMIT lấy DƯ 1
  // (pageSize+1) để biết "còn trang sau không" mà không cần COUNT toàn bảng.
  const ranked = await prisma.$queryRaw<RankedId[]>(Prisma.sql`
    SELECT l.id, ${rank} AS rank
    FROM "Listing" l
    JOIN "User" u ON u.id = l."ownerId"
    LEFT JOIN "Community" c ON c.id = l."communityId"
    WHERE ${Prisma.join(filters, " AND ")}
    ORDER BY rank DESC, l."createdAt" DESC, l.id DESC
    LIMIT ${data.pageSize + 1} OFFSET ${offset}
  `);
  const page = ranked.slice(0, data.pageSize);   // cắt bỏ phần "+1" dùng để dò trang sau
  // "Hydrate": SQL trên chỉ trả id; giờ load đầy đủ dữ liệu qua Prisma (an toàn kiểu).
  const listings = await prisma.listing.findMany({
    where: { id: { in: page.map((row) => row.id) } },
    include: {
      photos: { take: 1, orderBy: { position: "asc" } },     // lấy 1 ảnh bìa
      owner: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          reputationScore: true,
          reputationTier: true,
          followerCount: true,
          locationDistrict: true,
          // Nếu có người xem (viewerId), kèm thông tin "người xem có đang follow chủ tin không".
          followers: viewerId
            ? { where: { followerId: viewerId }, select: { followerId: true } }
            : false,
        },
      },
      community: { select: { id: true, name: true } },
      engagements: { select: { kind: true, userId: true } },
    },
  });
  // Prisma `findMany(in: [...])` KHÔNG đảm bảo thứ tự -> dựng Map để sắp lại đúng
  // thứ tự xếp hạng của `page`.
  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  return {
    items: page.flatMap((row) => {
      const listing = byId.get(row.id);
      // flatMap + [] : nếu vì lý do gì id không load được thì bỏ qua (không chèn null).
      return listing ? [{ ...listing, relevance: Number(row.rank) }] : [];
    }),
    // Còn dư phần "+1" nghĩa là còn trang sau -> trả cursor cho lần gọi tiếp.
    nextCursor: ranked.length > data.pageSize ? encodeCursor(offset + data.pageSize) : null,
    parsedQuery: { text, filters: { genre, author, isbn, condition, transactionType, communityId } },
  };
}

/**
 * relatedListings() — gợi ý "sách liên quan" trên trang chi tiết.
 * Lấy các tin ACTIVE khác trùng tác giả / thể loại / cộng đồng với tin gốc, rồi
 * chấm điểm liên quan (tác giả: 3, thể loại: 2, cùng cộng đồng: 1) và lấy top.
 */
export async function relatedListings(listingId: string, take = 4) {
  const source = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { author: true, genre: true, communityId: true },
  });
  if (!source) return [];                          // tin gốc không tồn tại -> không gợi ý
  const rows = await prisma.listing.findMany({
    where: {
      id: { not: listingId },                      // loại chính nó
      status: "ACTIVE",
      OR: [                                         // khớp ít nhất 1 trong các tiêu chí
        { author: { equals: source.author, mode: "insensitive" } },
        { genre: source.genre },
        ...(source.communityId ? [{ communityId: source.communityId }] : []),
      ],
    },
    include: { photos: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: take * 3,                                // lấy dư để còn chấm điểm rồi cắt top
  });
  return rows
    .map((listing) => ({
      ...listing,
      // Điểm liên quan: cùng tác giả quan trọng nhất (×3), rồi thể loại (×2), rồi cộng đồng (×1).
      relatedScore: Number(listing.author.toLowerCase() === source.author.toLowerCase()) * 3
        + Number(listing.genre === source.genre) * 2
        + Number(Boolean(source.communityId && listing.communityId === source.communityId)),
    }))
    .sort((a, b) => b.relatedScore - a.relatedScore)   // điểm cao lên đầu
    .slice(0, take);                                    // lấy top `take`
}

// Chỉ chấp nhận condition hợp lệ (so không phân biệt hoa thường); sai -> undefined (bỏ filter).
function validCondition(value?: string) {
  return BOOK_CONDITIONS.find((item) => item === value?.toUpperCase());
}

// Tương tự cho transactionType (GIFT/EXCHANGE/SELL).
function validType(value?: string) {
  return TRANSACTION_TYPES.find((item) => item === value?.toUpperCase());
}

/**
 * likePattern() — tạo mẫu cho ILIKE và ESCAPE các ký tự đặc biệt của LIKE
 * (`\` `%` `_`) để người dùng gõ "100%" không bị hiểu thành wildcard -> chống
 * cả lỗi tìm sai lẫn rủi ro injection mẫu.
 */
export function likePattern(value: string) {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

// Cursor phân trang = offset được mã hoá base64url (giấu con số, gọn trên URL).
function encodeCursor(offset: number) {
  return Buffer.from(String(offset)).toString("base64url");
}

// Giải mã cursor về offset; phòng thủ: cursor hỏng/âm -> trả 0 (về trang đầu).
function decodeCursor(cursor?: string) {
  if (!cursor) return 0;
  const value = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
