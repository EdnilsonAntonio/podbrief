import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

// GET - Buscar transcrição compartilhada por token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Buscar transcrição pelo token e verificar se está pública
    const transcription = await prisma.transcription.findFirst({
      where: {
        shareToken: token,
        isPublic: true,
      },
      include: {
        audioFile: {
          select: {
            id: true,
            originalFilename: true,
            durationSeconds: true,
            createdAt: true,
          },
        },
        summary: true,
        user: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: "Shared transcription not found or not available" },
        { status: 404 }
      );
    }

    // Retornar dados públicos (sem informações sensíveis)
    return NextResponse.json({
      id: transcription.id,
      text: transcription.text,
      audioFile: transcription.audioFile,
      summary: transcription.summary,
      createdAt: transcription.createdAt,
      sharedBy: {
        name: transcription.user.name,
        imageUrl: transcription.user.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching shared transcription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

