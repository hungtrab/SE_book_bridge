import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { BadRequestError, withErrorHandling } from "@/server/lib/errors";
import { saveAvatarImage } from "@/server/listings/photos";

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireUser();
  const form = await req.formData();
  const file = form.get("avatar");
  if (!(file instanceof File)) throw new BadRequestError("Choose an avatar image");
  return Response.json(await saveAvatarImage(file), { status: 201 });
});
