import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ filename: string }> }) {
  const { filename } = await ctx.params;
  if (!/^[a-f0-9-]+\.webp$/i.test(filename)) return new Response("Not found", { status: 404 });
  try {
    const uploadDir = process.env.LOCAL_UPLOAD_DIR ?? ".uploads";
    const bytes = await readFile(path.join(process.cwd(), uploadDir, "avatars", filename));
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
