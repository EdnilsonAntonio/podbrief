import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { checkUploadRateLimit } from "@/lib/rate-limit";

const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB por chunk (seguro para Vercel)
const MAX_CHUNKS = 100; // Limite de 100 chunks = ~300MB máximo

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const uploadId = formData.get("uploadId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const filename = formData.get("filename") as string;
    const contentType = formData.get("contentType") as string;
    const totalSize = parseInt(formData.get("totalSize") as string);

    // Validações
    if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !filename || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (totalChunks > MAX_CHUNKS) {
      return NextResponse.json(
        { error: `File too large. Maximum ${MAX_CHUNKS * 3}MB allowed.` },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/ogg",
      "audio/flac",
      "audio/webm",
    ];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed." },
        { status: 400 }
      );
    }

    // Verificar rate limit apenas no primeiro chunk
    if (chunkIndex === 0) {
      const rateLimitResult = await checkUploadRateLimit(`upload:${user.id}`);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: `You have exceeded the upload limit. Please try again after ${new Date(
              rateLimitResult.reset
            ).toLocaleTimeString()}`,
            reset: rateLimitResult.reset,
          },
          { status: 429 }
        );
      }
    }

    // Criar diretório para chunks
    const chunksDir = process.env.VERCEL 
      ? `/tmp/uploads/chunks/${uploadId}`
      : join(process.cwd(), "tmp", "uploads", "chunks", uploadId);
    
    if (!existsSync(chunksDir)) {
      await mkdir(chunksDir, { recursive: true });
    }

    // Salvar chunk
    const chunkPath = join(chunksDir, `chunk-${chunkIndex}`);
    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(chunkPath, buffer);

    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} saved for upload ${uploadId}`);

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`,
    });
  } catch (error: any) {
    console.error("Chunk upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload chunk", message: error.message },
      { status: 500 }
    );
  }
}

