import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { checkUploadRateLimit } from "@/lib/rate-limit";

/**
 * Gera uma URL assinada para upload direto ao Vercel Blob
 * Isso permite uploads maiores (até 100MB+) sem passar pela função serverless
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        {
          status: 429,
        }
      );
    }

    const body = await request.json();
    const { filename, contentType, size } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/ogg",
      "audio/flac",
      "audio/webm",
    ];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed." },
        { status: 400 }
      );
    }

    // Limite de 100MB para uploads via Blob
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (size && size > maxSize) {
      return NextResponse.json(
        { 
          error: "File too large",
          message: `File size (${(size / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum allowed size of 100MB. Please compress your audio file or split it into smaller parts.`
        },
        { status: 400 }
      );
    }

    // Verificar créditos
    if (user.credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits", message: "You don't have enough credits to transcribe files. Please purchase more credits." },
        { status: 400 }
      );
    }

    // Estimar créditos necessários (se size fornecido)
    if (size) {
      const estimatedMinutes = size / (1024 * 1024); // ~1MB por minuto
      const estimatedCredits = Math.max(0.01, Math.round(estimatedMinutes * 100) / 100);
      
      if (user.credits < estimatedCredits) {
        return NextResponse.json(
          { 
            error: "Insufficient credits",
            message: `This file appears to be approximately ${Math.round(estimatedMinutes)} minutes long, which requires ${estimatedCredits} credits. You currently have ${user.credits} credits. Please purchase more credits to transcribe this file.`,
          },
          { status: 400 }
        );
      }
    }

    // Gerar nome único para o arquivo
    const uniqueFilename = `audio/${user.id}-${Date.now()}-${filename}`;

    // Para uploads grandes, precisamos fazer upload no servidor
    // O Vercel Blob não suporta presigned URLs como o S3
    // Retornamos o filename para o cliente fazer upload via servidor
    return NextResponse.json({
      filename: uniqueFilename,
      uploadMethod: "server", // Indica que o upload deve ser feito via servidor
    });
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL", message: error.message },
      { status: 500 }
    );
  }
}

