import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { checkUploadRateLimit } from "@/lib/rate-limit";
import { logTranscriptionError, LogLevel, log } from "@/lib/monitoring";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar rate limit (10 uploads por hora)
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
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Verificar créditos
    if (user.credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed." },
        { status: 400 }
      );
    }

    // Validar tamanho (500MB max)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB." },
        { status: 400 }
      );
    }

    // Criar diretório temporário se não existir
    // No Vercel, apenas /tmp é gravável
    const uploadDir = process.env.VERCEL ? "/tmp/uploads" : join(process.cwd(), "tmp", "uploads");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Salvar arquivo temporariamente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Criar registro no banco de dados
    const audioFile = await prisma.audioFile.create({
      data: {
        userId: user.id,
        url: filepath, // Temporariamente salvar o caminho local
        originalFilename: file.name,
        sizeBytes: file.size,
        durationSeconds: null, // Será calculado depois
        status: "pending",
      },
    });

    // Iniciar processamento assíncrono
    // Não aguardamos o processamento aqui
    processTranscription(audioFile.id, filepath, file.name).catch((error) => {
      console.error("Error processing transcription:", error);
    });

    return NextResponse.json({
      success: true,
      audioFileId: audioFile.id,
      message: "File uploaded successfully. Processing started.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processTranscription(
  audioFileId: string,
  filepath: string,
  originalFilename: string
) {
  try {
    // Atualizar status para processing
    await prisma.audioFile.update({
      where: { id: audioFileId },
      data: { status: "processing" },
    });

    const audioFile = await prisma.audioFile.findUnique({
      where: { id: audioFileId },
      include: { user: true },
    });

    if (!audioFile) {
      throw new Error("Audio file not found");
    }

    // Verificar créditos novamente
    if (audioFile.user.credits <= 0) {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
      await unlink(filepath).catch(() => {});
      throw new Error("Insufficient credits");
    }

    // Importar OpenAI e fs
    const { openai } = await import("@/lib/openai");
    const fs = await import("fs");
    const { createReadStream } = fs;

    // Ler o arquivo como stream
    // A biblioteca OpenAI SDK aceita streams, buffers, ou File objects
    const fileStream = createReadStream(filepath);

    // Chamar Whisper API
    // No Node.js, podemos passar o stream diretamente
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fileStream as any,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    // Extrair o texto da transcrição
    // verbose_json retorna um objeto com propriedade 'text'
    const transcriptionText = (transcriptionResponse as any).text;

    // Obter duração real do áudio
    let durationSeconds = null;
    let durationMinutes = 0.01; // Default mínimo (1 segundo) se não conseguir obter

    try {
      const { parseFile } = await import("music-metadata");
      const metadata = await parseFile(filepath);
      if (metadata.format.duration) {
        durationSeconds = metadata.format.duration;
        durationMinutes = durationSeconds / 60; // Converter para minutos com decimais
      }
    } catch (metadataError) {
      console.warn(
        "Could not extract audio duration, using estimation:",
        metadataError
      );
      // Fallback para estimativa baseada no tamanho (assumindo ~1MB por minuto)
      const estimatedMinutes = (audioFile.sizeBytes || 0) / (1024 * 1024);
      durationMinutes = Math.max(0.01, estimatedMinutes);
    }

    // Calcular créditos (1 crédito = 1 minuto, usando frações)
    // Arredondar para 2 casas decimais e garantir mínimo de 0.01 crédito
    const creditsToDeduct = Math.max(
      0.01,
      Math.round(durationMinutes * 100) / 100
    );

    console.log(
      `Duration: ${
        durationSeconds ? durationSeconds.toFixed(2) : "N/A"
      }s (${durationMinutes.toFixed(
        2
      )} min), Credits to deduct: ${creditsToDeduct}, Current credits: ${
        audioFile.user.credits
      }`
    );

    // Verificar se tem créditos suficientes
    if (audioFile.user.credits < creditsToDeduct) {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
      await unlink(filepath).catch(() => {});
      throw new Error("Insufficient credits");
    }

    // Criar transcrição
    const transcriptionRecord = await prisma.transcription.create({
      data: {
        userId: audioFile.userId,
        audioFileId: audioFileId,
        text: transcriptionText,
        costCredits: creditsToDeduct,
      },
    });

    // Debitar créditos (calcular manualmente para garantir precisão com Float)
    const currentCredits = audioFile.user.credits;
    const newCredits = Math.max(0, currentCredits - creditsToDeduct);

    const updatedUser = await prisma.user.update({
      where: { id: audioFile.userId },
      data: {
        credits: Math.round(newCredits * 100) / 100, // Arredondar para 2 casas decimais
      },
    });

    // Verificar se créditos estão baixos (< 10) e enviar email (assíncrono, não bloqueia)
    if (updatedUser.credits < 10) {
      import("@/lib/emails").then(({ sendLowCreditsEmail }) => {
        sendLowCreditsEmail({
          to: updatedUser.email,
          name: updatedUser.name,
          currentCredits: updatedUser.credits,
        }).catch((error) => {
          console.error("Failed to send low credits email:", error);
        });
      });
    }

    // Atualizar status e duração do arquivo
    await prisma.audioFile.update({
      where: { id: audioFileId },
      data: {
        status: "completed",
        durationSeconds: durationSeconds || durationMinutes * 60, // Usar duração real ou fallback
      },
    });

    // Gerar resumo com GPT (assíncrono, não bloqueia)
    generateSummary(transcriptionRecord.id, transcriptionText).catch(
      (error) => {
        console.error("Error generating summary:", error);
        // Não falha o processo se o resumo falhar
      }
    );

    // Não deletar o arquivo imediatamente - manter para o player de áudio
    // O arquivo será deletado após 7 dias ou quando o usuário deletar a transcrição
    // Por enquanto, mantemos o arquivo disponível

    return transcriptionRecord;
  } catch (error: any) {
    // Log estruturado do erro
    logTranscriptionError(audioFileId, error, {
      filepath,
      originalFilename,
    });

    // Determinar mensagem de erro baseada no tipo
    let errorMessage = "Failed to process transcription";
    let logLevel = LogLevel.ERROR;

    if (error?.status === 429 || error?.code === "insufficient_quota") {
      errorMessage =
        "OpenAI API quota exceeded. Please check your OpenAI account billing.";
      logLevel = LogLevel.CRITICAL; // Quota é crítico
      log(logLevel, "OpenAI quota exceeded", {
        audioFileId,
        error: error.message,
      });
    } else if (error?.status === 401) {
      errorMessage = "OpenAI API key is invalid or expired.";
      logLevel = LogLevel.CRITICAL; // API key inválida é crítico
      log(logLevel, "OpenAI API key invalid", {
        audioFileId,
        error: error.message,
      });
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Marcar como erro no banco com mensagem de erro
    try {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: {
          status: "error",
          // Podemos adicionar um campo de erro depois, por enquanto apenas atualizamos o status
        },
      });
      await unlink(filepath).catch(() => {});

      // Log do erro para debug
      console.error(
        `Transcription failed for audioFile ${audioFileId}:`,
        errorMessage
      );
    } catch (updateError) {
      console.error("Error updating status:", updateError);
      // Se não conseguir atualizar, tenta deletar
      try {
        await prisma.audioFile.delete({ where: { id: audioFileId } });
        await unlink(filepath).catch(() => {});
      } catch (deleteError) {
        console.error("Error cleaning up:", deleteError);
      }
    }

    // Não relançar o erro para não quebrar o fluxo assíncrono
    // O status "error" já indica que houve problema
    return null;
  }
}

async function generateSummary(
  transcriptionId: string,
  transcriptionText: string
) {
  try {
    const { openai } = await import("@/lib/openai");

    // Criar prompt para gerar resumo
    const prompt = `Analyze the following transcription and provide a comprehensive summary. Return your response as a JSON object with the following structure:
{
  "shortSummary": "A brief 2-3 sentence summary",
  "longSummary": "A detailed paragraph summary (4-5 sentences)",
  "bulletPoints": "Key points separated by newlines (one per line)",
  "keywords": "Comma-separated list of important keywords",
  "sentiment": "positive, negative, or neutral",
  "language": "Language code (e.g., 'en', 'pt', 'es')"
}

Transcription:
${transcriptionText.substring(0, 15000)}${
      transcriptionText.length > 15000 ? "..." : ""
    }`;

    // Chamar GPT para gerar resumo
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Usando o modelo mais econômico
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that analyzes transcriptions and provides structured summaries in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Extrair e parsear a resposta
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from GPT");
    }

    const summaryData = JSON.parse(responseContent);

    // Salvar resumo no banco de dados
    await prisma.summary.create({
      data: {
        transcriptionId: transcriptionId,
        shortSummary: summaryData.shortSummary || null,
        longSummary: summaryData.longSummary || null,
        bulletPoints: summaryData.bulletPoints || null,
        keywords: summaryData.keywords || null,
        sentiment: summaryData.sentiment || null,
        language: summaryData.language || null,
      },
    });

    console.log(
      `Summary generated successfully for transcription ${transcriptionId}`
    );
  } catch (error) {
    console.error("Error generating summary:", error);
    // Não relançar o erro - o resumo é opcional
    throw error;
  }
}
