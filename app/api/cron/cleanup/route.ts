import { NextRequest, NextResponse } from "next/server";
import { cleanupOldFiles } from "@/lib/cleanup-files";

/**
 * Endpoint para limpeza automática de arquivos antigos
 * Deve ser chamado por um cron job (Vercel Cron, GitHub Actions, etc.)
 * 
 * Para proteger, você pode adicionar um secret:
 * ?secret=YOUR_SECRET_KEY
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar secret se configurado (opcional, mas recomendado)
    const secret = request.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await cleanupOldFiles();

    return NextResponse.json({
      success: result.success,
      deletedFiles: result.deletedFiles || 0,
      deletedRecords: result.deletedRecords || 0,
      deletedBlobs: result.deletedBlobs || 0,
      errors: result.errors || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cleanup cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup job failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

