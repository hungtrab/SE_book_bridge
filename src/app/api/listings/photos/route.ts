import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { BadRequestError, withErrorHandling } from "@/server/lib/errors";
import { saveListingPhoto } from "@/server/listings/photos";

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireUser();
  const form = await req.formData();
  const files = form.getAll("photos");
  const uploaded = await Promise.all(files.map((file) => {
    if (!(file instanceof File)) {
      throw new BadRequestError("Invalid photo upload");
    }
    return saveListingPhoto(file);
  }));
  return Response.json({ photos: uploaded }, { status: 201 });
});
