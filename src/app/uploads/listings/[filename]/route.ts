import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest } from "next/server";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ filename: string }> }) {
  const { filename } = await ctx.params;
  if (!/^[a-f0-9-]+\.webp$/i.test(filename)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const uploadDir = process.env.LOCAL_UPLOAD_DIR ?? ".uploads";
  const filePath = path.join(process.cwd(), uploadDir, "listings", filename);
  const ext = path.extname(filename).toLowerCase();
  try {
    const bytes = await readFile(filePath);
    return new Response(bytes, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
