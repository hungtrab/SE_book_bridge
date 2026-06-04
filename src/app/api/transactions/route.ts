import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { listMyTransactions, requestListing, RequestSchema } from "@/server/transactions/service";

const StatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED", "WAITLISTED", "IN_DELIVERY", "COMPLETED", "CANCELLED", "DISPUTED"]);
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const raw = new URL(req.url).searchParams.get("status");
  const parsed = raw ? StatusSchema.safeParse(raw) : null;
  if (parsed && !parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });
  return Response.json({ items: await listMyTransactions(user.id, parsed?.data) });
});
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser(); const body = await req.json().catch(() => ({})); const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  return Response.json(await requestListing(user, parsed.data), { status: 201 });
});
