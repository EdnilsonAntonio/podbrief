import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { readdir, unlink, rmdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Limpa chunks de um upload que falhou ou foi cancelado
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return NextResponse.json(
        { error: "uploadId is required" },
        { status: 400 }
      );
    }

    const chunksDir = process.env.VERCEL 
      ? `/tmp/uploads/chunks/${uploadId}`
      : join(process.cwd(), "tmp", "uploads", "chunks", uploadId);

    if (!existsSync(chunksDir)) {
      return NextResponse.json({
        success: true,
        message: "Chunks directory does not exist or already cleaned",
      });
    }

    try {
      const chunkFiles = await readdir(chunksDir);
      for (const chunkFile of chunkFiles) {
        await unlink(join(chunksDir, chunkFile));
      }
      await rmdir(chunksDir);
      console.log(`🧹 Cleaned up chunks for upload ${uploadId}`);
    } catch (cleanupError) {
      console.warn("Error cleaning up chunks:", cleanupError);
    }

    return NextResponse.json({
      success: true,
      message: "Chunks cleaned up successfully",
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup chunks", message: error.message },
      { status: 500 }
    );
  }
}

