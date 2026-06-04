import { NextRequest } from "next/server";

import { runReputationDecay } from "@/server/reputation/decay";
import { runAntiGamingScan } from "@/server/reputation/scan";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [decay, antiGaming] = await Promise.all([runReputationDecay(), runAntiGamingScan()]);
  return Response.json({ decay, antiGaming });
}

export const GET = POST;
