import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { processTranscriptionFromBlob } from "@/lib/transcription/process-blob";

/**
 * Endpoint para reprocessar transcrições que estão presas em "processing"
 * Útil para casos onde o processamento foi interrompido
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { audioFileId } = body;

    if (!audioFileId) {
      return NextResponse.json(
        { error: "audioFileId is required" },
        { status: 400 }
      );
    }

    // Buscar o arquivo de áudio
    const audioFile = await prisma.audioFile.findUnique({
      where: { id: audioFileId },
      include: { user: true },
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

    // Verificar se está em processamento ou erro
    if (audioFile.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Transcription already completed",
      });
    }

    // Verificar se tem URL do Blob
    if (!audioFile.url.startsWith("https://")) {
      return NextResponse.json(
        { error: "Audio file is not stored in Blob Storage" },
        { status: 400 }
      );
    }

    console.log(`🔄 [${audioFileId}] Retrying transcription processing`);

    // Reprocessar
    await processTranscriptionFromBlob(
      audioFileId,
      audioFile.url,
      audioFile.originalFilename || "audio"
    );

    return NextResponse.json({
      success: true,
      message: "Transcription processing restarted",
    });
  } catch (error: any) {
    console.error("Error in retry endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to retry transcription",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

