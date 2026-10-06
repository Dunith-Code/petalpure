import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { requireAdmin } from "@/lib/auth";

const FOLDER = "petalpure/products";

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Image uploads are not configured" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signs the sorted params string + secret with SHA-1
  const signature = createHash("sha1")
    .update(`folder=${FOLDER}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder: FOLDER });
}