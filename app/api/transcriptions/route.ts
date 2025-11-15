import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar transcrições completas
    const transcriptions = await prisma.transcription.findMany({
      where: { userId: user.id },
      include: {
        audioFile: true,
        summary: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Buscar arquivos de áudio que ainda estão em processamento (sem transcrição)
    const processingAudioFiles = await prisma.audioFile.findMany({
      where: {
        userId: user.id,
        transcription: null, // Ainda não tem transcrição
        status: {
          in: ["pending", "processing"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformar arquivos em processamento em formato similar para a UI
    // IMPORTANTE: Para itens em processamento, usamos o ID do AudioFile como ID temporário
    // Quando a transcrição for completada, o ID será o da Transcription
    const processingItems = processingAudioFiles.map((audioFile) => ({
      id: audioFile.id, // ID temporário (AudioFile ID) - será substituído quando completar
      audioFile: {
        id: audioFile.id,
        originalFilename: audioFile.originalFilename,
        durationSeconds: audioFile.durationSeconds,
        status: audioFile.status,
        createdAt: audioFile.createdAt,
      },
      costCredits: 0, // Ainda não foi debitado
      createdAt: audioFile.createdAt,
      audioFileId: audioFile.id,
      _isProcessing: true, // Flag para identificar que está em processamento
    }));

    // Combinar e ordenar por data de criação
    const allItems = [...transcriptions, ...processingItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
