import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { existsSync, statSync } from "fs";
import { join } from "path";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: "unknown",
      diskSpace: "unknown",
      openai: "unknown",
    },
  };

  try {
    // Verificar conexão com banco de dados
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = "healthy";
    } catch (error) {
      health.checks.database = "unhealthy";
      health.status = "degraded";
    }

    // Verificar espaço em disco (verificar diretório de uploads)
    try {
      const uploadDir = join(process.cwd(), "tmp", "uploads");
      if (existsSync(uploadDir)) {
        const stats = statSync(uploadDir);
        // Se conseguir ler o diretório, está OK
        health.checks.diskSpace = "healthy";
      } else {
        health.checks.diskSpace = "healthy"; // Diretório será criado quando necessário
      }
    } catch (error) {
      health.checks.diskSpace = "unhealthy";
      health.status = "degraded";
    }

    // Verificar OpenAI API key (básico - apenas verificar se existe)
    try {
      if (process.env.OPEN_AI_KEY) {
        health.checks.openai = "configured";
      } else {
        health.checks.openai = "not_configured";
        health.status = "degraded";
      }
    } catch (error) {
      health.checks.openai = "unknown";
    }

    // Se algum check crítico falhou, marcar como unhealthy
    if (
      health.checks.database === "unhealthy" ||
      health.checks.diskSpace === "unhealthy"
    ) {
      health.status = "unhealthy";
    }

    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}

