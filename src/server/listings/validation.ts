import { z } from "zod";

export const BOOK_CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"] as const;
export const TRANSACTION_TYPES = ["GIFT", "EXCHANGE", "SELL"] as const;
export const LISTING_STATUSES = ["ACTIVE", "RESERVED", "UNAVAILABLE", "COMPLETED", "REMOVED"] as const;

export const PRICE_CAP_VND = parseInt(process.env.SALE_PRICE_CAP_VND ?? "50000", 10);

const blankToUndefined = (value: unknown) => value === "" ? undefined : value;
const OptionalText = (max: number) => z.preprocess(
  blankToUndefined,
  z.string().trim().max(max).optional(),
);

export const IsbnSchema = z.string()
  .trim()
  .transform((value) => value.replace(/[-\s]/g, "").toUpperCase())
  .refine((value) => /^(\d{9}[\dX]|\d{13})$/.test(value), "ISBN must be ISBN-10 or ISBN-13");

const ListingBaseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  isbn: z.preprocess(blankToUndefined, IsbnSchema.optional()),
  publisher: OptionalText(200),
  publicationYear: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1500).max(2100).optional(),
  ),
  language: z.preprocess(blankToUndefined, z.string().trim().min(1).max(10).optional()),
  genre: z.string().trim().min(1).max(64),
  condition: z.enum(BOOK_CONDITIONS),
  description: z.string().trim().min(20).max(2000),
  transactionType: z.enum(TRANSACTION_TYPES),
  askingPriceVnd: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(0).optional(),
  ),
  communityId: z.preprocess(blankToUndefined, z.string().trim().optional()),
});

export const ListingCreateSchema = ListingBaseSchema.extend({
  photoUrls: z.array(z.string().url()).max(5).optional(),
}).superRefine(validateListingBusinessRules);

export const ListingPatchSchema = ListingBaseSchema.extend({
  photoUrls: z.array(z.string().url()).max(5).optional(),
}).partial().superRefine(validateListingBusinessRules);

export const ListingQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  genre: z.string().trim().min(1).optional(),
  condition: z.enum(BOOK_CONDITIONS).optional(),
  transactionType: z.enum(TRANSACTION_TYPES).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  communityId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export type ListingCreateInput = z.infer<typeof ListingCreateSchema>;
export type ListingPatchInput = z.infer<typeof ListingPatchSchema>;
export type ListingQueryInput = z.infer<typeof ListingQuerySchema>;

function validateListingBusinessRules(
  data: { transactionType?: string; askingPriceVnd?: number },
  ctx: z.RefinementCtx,
) {
  if (data.transactionType === "SELL") {
    if (data.askingPriceVnd === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["askingPriceVnd"],
        message: "Sell listings must include askingPriceVnd",
      });
      return;
    }
    if (data.askingPriceVnd > PRICE_CAP_VND) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["askingPriceVnd"],
        message: `Asking price exceeds the cap of ${PRICE_CAP_VND} VND`,
      });
    }
  } else if (data.askingPriceVnd !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["askingPriceVnd"],
      message: "askingPriceVnd is only allowed for SELL listings",
    });
  }
}

export function cleanListingData<T extends Record<string, unknown>>(data: T): T {
  return data;
}
