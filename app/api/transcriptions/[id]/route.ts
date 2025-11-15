import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";

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

    // Primeiro, tentar buscar pela Transcription ID
    let transcription = await prisma.transcription.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        costCredits: true,
        createdAt: true,
        shareToken: true,
        isPublic: true,
        userId: true,
        audioFile: {
          select: {
            id: true,
            originalFilename: true,
            durationSeconds: true,
            createdAt: true,
          },
        },
        summary: {
          select: {
            bulletPoints: true,
            keywords: true,
            sentiment: true,
            shortSummary: true,
            longSummary: true,
            language: true,
          },
        },
      },
    });

    // Se não encontrar, pode ser que o ID seja do AudioFile
    // Nesse caso, buscar a Transcription relacionada pelo audioFileId
    if (!transcription) {
      const audioFile = await prisma.audioFile.findUnique({
        where: { id },
        select: {
          id: true,
          originalFilename: true,
          durationSeconds: true,
          createdAt: true,
          userId: true,
        },
      });

      if (audioFile) {
        // Verificar se o usuário é o dono do AudioFile
        if (audioFile.userId !== user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Buscar a Transcription relacionada pelo audioFileId
        const relatedTranscription = await prisma.transcription.findUnique({
          where: { audioFileId: audioFile.id },
          select: {
            id: true,
            text: true,
            costCredits: true,
            createdAt: true,
            shareToken: true,
            isPublic: true,
            userId: true,
            audioFile: {
              select: {
                id: true,
                originalFilename: true,
                durationSeconds: true,
                createdAt: true,
              },
            },
            summary: {
              select: {
                bulletPoints: true,
                keywords: true,
                sentiment: true,
                shortSummary: true,
                longSummary: true,
                language: true,
              },
            },
          },
        });

        if (relatedTranscription) {
          transcription = relatedTranscription;
        } else {
          // Se não há transcrição ainda, retornar 404
          return NextResponse.json(
            {
              error:
                "Transcription not found. The audio file is still being processed.",
            },
            { status: 404 }
          );
        }
      }
    }

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription not found" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono
    if (transcription.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(transcription);
  } catch (error) {
    console.error("Error fetching transcription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
