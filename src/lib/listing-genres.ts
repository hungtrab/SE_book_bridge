export const LISTING_GENRES = [
  "software",
  "computer-science",
  "ai",
  "non-fiction",
  "business",
  "psychology",
  "self-help",
  "fiction",
  "memoir",
  "history",
  "education",
  "science",
  "math",
  "language",
] as const;

export function normalizeListingGenre(value?: string | null) {
  const raw = value?.trim().toLowerCase();
  if (!raw) return undefined;
  if (raw.includes("artificial intelligence") || raw === "ai" || raw.includes("machine learning")) return "ai";
  if (raw.includes("computer") || raw.includes("programming") || raw.includes("software")) return "software";
  if (raw.includes("algorithm") || raw.includes("data structure")) return "computer-science";
  if (raw.includes("business") || raw.includes("startup") || raw.includes("management")) return "business";
  if (raw.includes("psychology") || raw.includes("thinking")) return "psychology";
  if (raw.includes("habit") || raw.includes("self-help") || raw.includes("self help")) return "self-help";
  if (raw.includes("history")) return "history";
  if (raw.includes("memoir") || raw.includes("biography")) return "memoir";
  if (raw.includes("fiction") || raw.includes("novel")) return "fiction";
  if (raw.includes("education")) return "education";
  if (raw.includes("science")) return "science";
  if (raw.includes("math")) return "math";
  if (raw.includes("language")) return "language";
  return LISTING_GENRES.includes(raw as (typeof LISTING_GENRES)[number]) ? raw : undefined;
}
