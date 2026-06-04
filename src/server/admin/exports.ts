import { BadRequestError } from "../lib/errors";
import { grantMetrics } from "./stats";

export async function buildGrantReport(fromRaw?: string, toRaw?: string) {
  const to = parseDate(toRaw, new Date());
  const from = parseDate(fromRaw, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
  if (from > to) throw new BadRequestError("from must be before to");
  const metrics = await grantMetrics(from, to);
  const rows = [
    ["BookBridge Grant Report", ""],
    ["From", from.toISOString()],
    ["To", to.toISOString()],
    ["Metric", "Value"],
    ["New users", metrics.newUsers],
    ["Completed transactions", metrics.completedTransactions],
    ["Books circulated", metrics.booksCirculated],
    ["New listings", metrics.newListings],
    ["New communities", metrics.newCommunities],
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function parseDate(raw: string | undefined, fallback: Date) {
  if (!raw) return fallback;
  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) throw new BadRequestError("Invalid date");
  return value;
}
