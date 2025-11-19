import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Buscar o arquivo de áudio
    const audioFile = await prisma.audioFile.findUnique({
      where: { id },
      include: {
        transcription: true,
      },
    });

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file not found" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono
    if (audioFile.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determinar o tipo MIME baseado na extensão
    const filename = audioFile.originalFilename || "";
    let contentType = "audio/mpeg"; // Default
    if (filename.endsWith(".wav")) contentType = "audio/wav";
    else if (filename.endsWith(".m4a")) contentType = "audio/mp4";
    else if (filename.endsWith(".ogg")) contentType = "audio/ogg";
    else if (filename.endsWith(".flac")) contentType = "audio/flac";
    else if (filename.endsWith(".webm")) contentType = "audio/webm";

    // Verificar se é uma URL do Blob (começa com https://) ou caminho local
    let fileBuffer: Buffer;
    
    if (audioFile.url.startsWith("https://")) {
      // É uma URL do Vercel Blob - fazer fetch
      console.log(`📥 Fetching audio from Blob: ${audioFile.url}`);
      try {
        const response = await fetch(audioFile.url);
        if (!response.ok) {
          console.error(`❌ Failed to fetch from Blob: ${response.status} ${response.statusText}`);
          return NextResponse.json(
            { error: "Audio file no longer available" },
            { status: 404 }
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        console.log(`✅ Audio fetched from Blob, size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
      } catch (fetchError: any) {
        console.error("Error fetching from Blob:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch audio file" },
          { status: 500 }
        );
      }
    } else {
      // É um caminho local - ler do sistema de arquivos
      if (!existsSync(audioFile.url)) {
        return NextResponse.json(
          { error: "Audio file no longer available" },
          { status: 404 }
        );
      }
      fileBuffer = await readFile(audioFile.url);
    }

    // Retornar o arquivo com headers apropriados
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${audioFile.originalFilename || "audio"}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving audio file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

