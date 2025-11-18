import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { existsSync } from "fs";

/**
 * Cron job para processar transcrições pendentes
 * Executa a cada minuto para garantir que transcrições sejam processadas
 * mesmo se o fetch interno falhar
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada (do Vercel Cron)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Processing pending transcriptions...");

    // Buscar arquivos pendentes (pending ou processing há mais de 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const pendingFiles = await prisma.audioFile.findMany({
      where: {
        OR: [
          { status: "pending" },
          {
            status: "processing",
            createdAt: {
              lt: fiveMinutesAgo, // Processing há mais de 5 minutos pode estar travado
            },
          },
        ],
      },
      include: {
        user: true,
      },
      take: 10, // Processar até 10 por vez
    });

    console.log(`📋 Found ${pendingFiles.length} pending files`);

    if (pendingFiles.length === 0) {
      return NextResponse.json({ message: "No pending files" });
    }

    // Processar cada arquivo
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const results = await Promise.allSettled(
      pendingFiles.map(async (audioFile) => {
        // Verificar se o arquivo existe
        if (!existsSync(audioFile.url)) {
          console.error(`❌ File not found: ${audioFile.url}`);
          await prisma.audioFile.update({
            where: { id: audioFile.id },
            data: { status: "error" },
          });
          return { id: audioFile.id, status: "error", reason: "File not found" };
        }

        // Chamar endpoint de processamento
        try {
          const response = await fetch(`${baseUrl}/api/transcriptions/process`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audioFileId: audioFile.id,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error(`❌ Error processing ${audioFile.id}:`, error);
            return { id: audioFile.id, status: "error", reason: error.message };
          }

          const result = await response.json();
          console.log(`✅ Processed ${audioFile.id}`);
          return { id: audioFile.id, status: "success", result };
        } catch (error: any) {
          console.error(`❌ Error processing ${audioFile.id}:`, error);
          return { id: audioFile.id, status: "error", reason: error.message };
        }
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled" && r.value.status === "success").length;
    const failed = results.length - successful;

    return NextResponse.json({
      message: `Processed ${pendingFiles.length} files`,
      successful,
      failed,
      results: results.map((r) => (r.status === "fulfilled" ? r.value : { status: "error", reason: r.reason })),
    });
  } catch (error: any) {
    console.error("Error in process-pending cron:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

