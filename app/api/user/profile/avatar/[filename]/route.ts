import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { filename } = await params;

    // Verificar se o arquivo pertence ao usuário
    if (!filename.startsWith(user.id)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // No Vercel, apenas /tmp é gravável
    const filepath = process.env.VERCEL
      ? `/tmp/uploads/avatars/${filename}`
      : join(process.cwd(), "tmp", "uploads", "avatars", filename);

    if (!existsSync(filepath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(filepath);
    const mimeType = getMimeType(filename);

    const headers = new Headers();
    headers.set("Content-Type", mimeType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error("Error serving avatar:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

function getMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return mimeTypes[extension || ""] || "image/jpeg";
}

