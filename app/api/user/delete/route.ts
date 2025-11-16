import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar todos os dados do usuário
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        audioFiles: true,
        transcriptions: {
          include: {
            summary: true,
          },
        },
        creditPurchases: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Deletar arquivos de áudio
    for (const audioFile of userData.audioFiles) {
      try {
        if (existsSync(audioFile.url)) {
          await unlink(audioFile.url).catch(() => {
            // Ignorar erros se o arquivo já não existir
          });
        }
      } catch (error) {
        console.error(`Error deleting audio file ${audioFile.url}:`, error);
      }
    }

    // Deletar avatar se existir
    if (userData.imageUrl && userData.imageUrl.startsWith("/api/user/profile/avatar/")) {
      try {
        const filename = userData.imageUrl.split("/").pop();
        if (filename) {
          const avatarPath = join(
            process.cwd(),
            "tmp",
            "uploads",
            "avatars",
            filename
          );
          if (existsSync(avatarPath)) {
            await unlink(avatarPath).catch(() => {
              // Ignorar erros se o arquivo já não existir
            });
          }
        }
      } catch (error) {
        console.error("Error deleting avatar:", error);
      }
    }

    // Deletar summaries primeiro (relacionadas com transcriptions)
    const transcriptionIds = userData.transcriptions.map((t) => t.id);
    if (transcriptionIds.length > 0) {
      await prisma.summary.deleteMany({
        where: {
          transcriptionId: {
            in: transcriptionIds,
          },
        },
      });
    }

    // Deletar transcriptions
    await prisma.transcription.deleteMany({
      where: { userId: user.id },
    });

    // Deletar audioFiles
    await prisma.audioFile.deleteMany({
      where: { userId: user.id },
    });

    // Deletar creditPurchases
    await prisma.creditPurchase.deleteMany({
      where: { userId: user.id },
    });

    // Salvar dados do usuário antes de deletar (para o email)
    const userEmail = userData.email;
    const userName = userData.name;

    // Deletar o usuário (último passo)
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Enviar email de despedida (assíncrono, não bloqueia)
    // Fazemos isso após deletar para não ter problemas com a referência do usuário
    import("@/lib/emails").then(({ sendGoodbyeEmail }) => {
      sendGoodbyeEmail({
        to: userEmail,
        name: userName,
      }).catch((error) => {
        console.error("Failed to send goodbye email:", error);
      });
    });

    return NextResponse.json({ 
      success: true,
      message: "Account deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

