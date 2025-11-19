import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { checkUploadRateLimit } from "@/lib/rate-limit";

/**
 * Processa um arquivo que foi enviado via Vercel Blob Storage
 * Este endpoint é chamado após o upload direto ao Blob
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { blobUrl, originalFilename, size } = body;

    if (!blobUrl || !originalFilename) {
      return NextResponse.json(
        { error: "blobUrl and originalFilename are required" },
        { status: 400 }
      );
    }

    // Verificar rate limit
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

    // Verificar créditos
    if (user.credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits", message: "You don't have enough credits to transcribe files. Please purchase more credits." },
        { status: 400 }
      );
    }

    // Estimar créditos necessários
    // Usar Math.round para arredondar para o centésimo mais próximo
    // A estimativa é conservadora porque assume 1MB por minuto (maioria dos áudios é mais compacta)
    if (size) {
      const estimatedMinutes = size / (1024 * 1024); // ~1MB por minuto
      const estimatedCredits = Math.max(0.01, Math.round(estimatedMinutes * 100) / 100);
      
      if (user.credits <= 0 || user.credits < estimatedCredits) {
        return NextResponse.json(
          { 
            error: "Insufficient credits",
            message: `This file appears to be approximately ${Math.round(estimatedMinutes)} minutes long, which requires ${estimatedCredits} credits. You currently have ${user.credits} credits. Please purchase more credits to transcribe this file.`,
          },
          { status: 400 }
        );
      }
    }

    // Criar registro no banco de dados
    const audioFile = await prisma.audioFile.create({
      data: {
        userId: user.id,
        url: blobUrl, // URL do Blob Storage
        originalFilename: originalFilename,
        sizeBytes: size || null,
        durationSeconds: null,
        status: "pending",
      },
    });

    console.log(`🚀 Starting transcription processing for audioFile ${audioFile.id} (from Blob)`);
    
    // Processar transcrição (assíncrono, não bloqueia)
    // Importar a função de processamento dinamicamente
    import("@/lib/transcription/process-blob").then(({ processTranscriptionFromBlob }) => {
      processTranscriptionFromBlob(audioFile.id, blobUrl, originalFilename).catch((error) => {
        console.error("Error processing transcription from blob:", error);
      });
    });

    return NextResponse.json({
      success: true,
      audioFileId: audioFile.id,
      message: "File uploaded successfully. Processing started.",
    });
  } catch (error: any) {
    console.error("Blob upload processing error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

