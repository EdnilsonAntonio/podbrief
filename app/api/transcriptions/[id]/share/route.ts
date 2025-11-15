import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { randomBytes } from "crypto";

// Gerar token único para compartilhamento
function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

// POST - Ativar/desativar compartilhamento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { enable } = body; // enable: true para ativar, false para desativar

    // Buscar transcrição
    const transcription = await prisma.transcription.findUnique({
      where: { id },
      include: { audioFile: true },
    });

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

    if (enable) {
      // Ativar compartilhamento - gerar token se não existir
      let shareToken = transcription.shareToken;
      
      if (!shareToken) {
        // Gerar token único (verificar se já existe)
        let attempts = 0;
        do {
          shareToken = generateShareToken();
          const existing = await prisma.transcription.findFirst({
            where: { shareToken },
          });
          if (!existing) break;
          attempts++;
          if (attempts > 10) {
            throw new Error("Failed to generate unique share token");
          }
        } while (true);
      }

      await prisma.transcription.update({
        where: { id },
        data: {
          shareToken,
          isPublic: true,
        },
      });

      return NextResponse.json({
        success: true,
        shareToken,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/${shareToken}`,
      });
    } else {
      // Desativar compartilhamento
      await prisma.transcription.update({
        where: { id },
        data: {
          isPublic: false,
          // Não removemos o token para permitir reativar facilmente
        },
      });

      return NextResponse.json({
        success: true,
        shareToken: null,
        shareUrl: null,
      });
    }
  } catch (error) {
    console.error("Error managing share:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Obter status de compartilhamento
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

    const transcription = await prisma.transcription.findUnique({
      where: { id },
      select: {
        shareToken: true,
        isPublic: true,
        userId: true,
      },
    });

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

    const shareUrl = transcription.shareToken && transcription.isPublic
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/${transcription.shareToken}`
      : null;

    return NextResponse.json({
      shareToken: transcription.shareToken,
      isPublic: transcription.isPublic,
      shareUrl,
    });
  } catch (error) {
    console.error("Error fetching share status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

