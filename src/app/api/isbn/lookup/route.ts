import { NextRequest } from "next/server";

import { lookupIsbn } from "@/server/listings/isbn";
import { withErrorHandling } from "@/server/lib/errors";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const isbn = new URL(req.url).searchParams.get("isbn");
  const out = await lookupIsbn(isbn ?? "");
  return Response.json(out);
});
