import { NextRequest } from "next/server";
import { runTransactionScheduler } from "@/server/transactions/scheduler";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await runTransactionScheduler());
}

export const GET = POST;
