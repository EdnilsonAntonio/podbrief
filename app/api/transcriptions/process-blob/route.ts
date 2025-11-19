import { NextRequest, NextResponse } from "next/server";
import { processTranscriptionFromBlob } from "@/lib/transcription/process-blob";

/**
 * Endpoint dedicado para processar transcrições de arquivos armazenados no Vercel Blob
 * Este endpoint é chamado após o upload ser completado para garantir que o processamento
 * continue mesmo após a resposta do upload ser enviada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioFileId, blobUrl, filename } = body;

    if (!audioFileId || !blobUrl || !filename) {
      return NextResponse.json(
        { error: "Missing required fields: audioFileId, blobUrl, filename" },
        { status: 400 }
      );
    }

    console.log(`🚀 [${audioFileId}] Processing transcription from dedicated endpoint`);

    // Processar transcrição
    await processTranscriptionFromBlob(audioFileId, blobUrl, filename);

    return NextResponse.json({
      success: true,
      message: "Transcription processing started",
    });
  } catch (error: any) {
    console.error("Error in process-blob endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to process transcription",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

