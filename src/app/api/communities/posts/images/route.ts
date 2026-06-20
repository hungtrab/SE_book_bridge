import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { BadRequestError, withErrorHandling } from "@/server/lib/errors";
import { saveCommunityPostImage } from "@/server/listings/photos";

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireUser();
  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) throw new BadRequestError("Choose an image to upload");
  return Response.json(await saveCommunityPostImage(file), { status: 201 });
});
