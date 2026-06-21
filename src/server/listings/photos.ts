import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

import { BadRequestError } from "../lib/errors";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1024;
const WEBP_QUALITY = 82;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", true],
  ["image/png", true],
  ["image/webp", true],
]);

export async function saveListingPhoto(file: File): Promise<{ url: string }> {
  return saveUploadedImage(file, "listings");
}

export async function saveCommunityPostImage(file: File): Promise<{ url: string }> {
  return saveUploadedImage(file, "community-posts");
}

export async function saveAvatarImage(file: File): Promise<{ url: string }> {
  return saveUploadedImage(file, "avatars");
}

async function saveUploadedImage(file: File, folder: "listings" | "community-posts" | "avatars"): Promise<{ url: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new BadRequestError("Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new BadRequestError("Photo must be 5MB or smaller");
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const key = `${folder}/${filename}`;
  const bytes = await resizeToWebp(Buffer.from(await file.arrayBuffer()));

  if ((process.env.UPLOAD_BACKEND ?? "local") === "s3") {
    return uploadToS3(key, bytes);
  }
  return saveLocal(folder, filename, bytes);
}

export async function resizeToWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

async function saveLocal(folder: string, filename: string, bytes: Buffer): Promise<{ url: string }> {
  const uploadDir = process.env.LOCAL_UPLOAD_DIR ?? ".uploads";
  const targetDir = path.join(process.cwd(), uploadDir, folder);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), bytes);
  return { url: `/uploads/${folder}/${filename}` };
}

async function uploadToS3(key: string, bytes: Buffer): Promise<{ url: string }> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET must be configured when UPLOAD_BACKEND=s3");

  const client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
  });

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: bytes,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return { url: publicS3Url(bucket, key) };
}

function publicS3Url(bucket: string, key: string): string {
  if (process.env.S3_PUBLIC_BASE_URL) {
    return `${process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }
  if (process.env.S3_ENDPOINT) {
    return `${process.env.S3_ENDPOINT.replace(/\/$/, "")}/${bucket}/${key}`;
  }
  const region = process.env.S3_REGION ?? "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
