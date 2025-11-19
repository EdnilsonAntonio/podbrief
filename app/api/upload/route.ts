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
        { error: "Insufficient credits", message: "You don't have enough credits to transcribe files. Please purchase more credits." },
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

    // Validar tamanho
    // IMPORTANTE: Vercel tem limite HARD de ~4.5MB para o body de requisições
    // Arquivos maiores que isso são REJEITADOS pelo Vercel ANTES de chegar ao código
    // Este código só executa para arquivos que passaram pelo limite do Vercel
    const maxSize = 4 * 1024 * 1024; // 4MB (limite seguro, abaixo do limite do Vercel)
    
    if (file.size > maxSize) {
      // Se chegou aqui, significa que o arquivo passou pelo limite do Vercel
      // Mas isso não deveria acontecer - o Vercel deveria ter rejeitado antes
      // De qualquer forma, rejeitamos aqui também
      return NextResponse.json(
        { 
          error: "File too large",
          message: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum allowed size of 4MB. Vercel serverless functions have a hard limit of 4.5MB. Please compress your audio file or split it into smaller parts.`
        },
        { status: 413 }
      );
    }

    // Estimar duração baseada no tamanho do arquivo (estimativa conservadora: ~1MB por minuto)
    // Adicionar margem de segurança de 5% para compensar variações na duração real
    // Isso ajuda a validar créditos antes de aceitar o upload
    // Usamos Math.ceil para arredondar para cima e garantir que sempre tenha créditos suficientes
    const estimatedMinutes = file.size / (1024 * 1024); // MB
    const estimatedCreditsWithMargin = estimatedMinutes * 1.05; // Adicionar 5% de margem
    const estimatedCredits = Math.max(0.01, Math.ceil(estimatedCreditsWithMargin * 100) / 100);
    
    // Verificar se tem créditos suficientes para a estimativa
    // Usamos <= para permitir exatamente o valor necessário
    if (user.credits <= 0 || user.credits < estimatedCredits) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          message: `This file appears to be approximately ${Math.round(estimatedMinutes)} minutes long, which requires ${estimatedCredits} credits. You currently have ${user.credits} credits. Please purchase more credits to transcribe this file.`,
          estimatedMinutes: Math.round(estimatedMinutes),
          estimatedCredits,
          currentCredits: user.credits
        },
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
    // No Vercel, processamos diretamente mas não bloqueamos a resposta
    console.log(`🚀 Starting transcription processing for audioFile ${audioFile.id}`);
    
    // Processar diretamente (não bloqueia a resposta HTTP)
    // O Vercel mantém a função ativa enquanto houver trabalho pendente
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
    console.log(`📝 [${audioFileId}] Starting transcription process`);
    console.log(`📂 [${audioFileId}] File path: ${filepath}`);
    
    // Atualizar status para processing
    await prisma.audioFile.update({
      where: { id: audioFileId },
      data: { status: "processing" },
    });
    console.log(`✅ [${audioFileId}] Status updated to processing`);

    const audioFile = await prisma.audioFile.findUnique({
      where: { id: audioFileId },
      include: { user: true },
    });

    if (!audioFile) {
      throw new Error("Audio file not found");
    }

    console.log(`👤 [${audioFileId}] User: ${audioFile.user.email}, Credits: ${audioFile.user.credits}`);

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

    // Verificar se o arquivo existe
    const { existsSync } = await import("fs");
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }
    console.log(`📂 [${audioFileId}] File exists, reading stream...`);

    // Ler o arquivo como stream
    const fileStream = createReadStream(filepath);
    console.log(`🎤 [${audioFileId}] Calling OpenAI Whisper API...`);

    // Chamar Whisper API
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fileStream as any,
      model: "whisper-1",
      response_format: "verbose_json",
    });
    
    console.log(`✅ [${audioFileId}] Transcription received from OpenAI`);

    // Extrair o texto da transcrição
    const transcriptionText = (transcriptionResponse as any).text;
    console.log(`📄 [${audioFileId}] Transcription text length: ${transcriptionText.length} characters`);

    // Obter duração real do áudio
    let durationSeconds = null;
    let durationMinutes = 0.01;

    try {
      const { parseFile } = await import("music-metadata");
      const metadata = await parseFile(filepath);
      if (metadata.format.duration) {
        durationSeconds = metadata.format.duration;
        durationMinutes = durationSeconds / 60;
      }
      console.log(`⏱️ [${audioFileId}] Duration extracted: ${durationSeconds}s (${durationMinutes.toFixed(2)} min)`);
    } catch (metadataError) {
      console.warn(`⚠️ [${audioFileId}] Could not extract audio duration, using estimation:`, metadataError);
      const estimatedMinutes = (audioFile.sizeBytes || 0) / (1024 * 1024);
      durationMinutes = Math.max(0.01, estimatedMinutes);
    }

    // Calcular créditos
    // Usar Math.ceil para arredondar para cima e garantir que sempre tenha créditos suficientes
    // Exemplo: 10.01 minutos = 10.01 créditos (arredondado para cima)
    // Exemplo: 10.00 minutos = 10.00 créditos
    const creditsToDeduct = Math.max(
      0.01,
      Math.ceil(durationMinutes * 100) / 100
    );

    console.log(
      `💰 [${audioFileId}] Credits to deduct: ${creditsToDeduct}, Current credits: ${audioFile.user.credits}, Duration: ${durationMinutes.toFixed(2)} min`
    );

    // Verificar se tem créditos suficientes
    // Usar <= para permitir exatamente o valor necessário
    if (audioFile.user.credits <= 0 || audioFile.user.credits < creditsToDeduct) {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
      await unlink(filepath).catch(() => {});
      throw new Error("Insufficient credits");
    }

    // Criar transcrição
    console.log(`💾 [${audioFileId}] Creating transcription record...`);
    const transcriptionRecord = await prisma.transcription.create({
      data: {
        userId: audioFile.userId,
        audioFileId: audioFileId,
        text: transcriptionText,
        costCredits: creditsToDeduct,
      },
    });
    console.log(`✅ [${audioFileId}] Transcription record created: ${transcriptionRecord.id}`);

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
        durationSeconds: durationSeconds || durationMinutes * 60,
      },
    });
    console.log(`✅ [${audioFileId}] Status updated to completed`);

    // Gerar resumo com GPT (assíncrono, não bloqueia)
    generateSummary(transcriptionRecord.id, transcriptionText).catch(
      (error) => {
        console.error(`❌ [${audioFileId}] Error generating summary:`, error);
      }
    );

    console.log(`🎉 [${audioFileId}] Transcription process completed successfully!`);
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
