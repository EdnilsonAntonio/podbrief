import { prisma } from "@/db/prisma";
import { unlink } from "fs/promises";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { logTranscriptionError, LogLevel, log } from "@/lib/monitoring";

/**
 * Processa transcrição de um arquivo armazenado no Vercel Blob
 */
export async function processTranscriptionFromBlob(
  audioFileId: string,
  blobUrl: string,
  originalFilename: string
) {
  try {
    console.log(`📝 [${audioFileId}] Starting transcription process from Blob`);
    console.log(`📂 [${audioFileId}] Blob URL: ${blobUrl}`);
    
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
      throw new Error("Insufficient credits");
    }

    // Baixar arquivo do Blob para /tmp para processar
    console.log(`⬇️ [${audioFileId}] Downloading file from Blob...`);
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file from Blob: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar temporariamente em /tmp
    const uploadDir = process.env.VERCEL ? "/tmp/uploads" : join(process.cwd(), "tmp", "uploads");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const tempFilepath = join(uploadDir, `${audioFileId}-${originalFilename}`);
    await writeFile(tempFilepath, buffer);
    console.log(`💾 [${audioFileId}] File saved to: ${tempFilepath}`);

    // Importar OpenAI e fs
    const { openai } = await import("@/lib/openai");
    const fs = await import("fs");
    const { createReadStream } = fs;

    // Verificar se o arquivo existe
    const { existsSync: exists } = await import("fs");
    if (!exists(tempFilepath)) {
      throw new Error(`File not found: ${tempFilepath}`);
    }
    console.log(`📂 [${audioFileId}] File exists, reading stream...`);

    // Ler o arquivo como stream
    const fileStream = createReadStream(tempFilepath);
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
      const metadata = await parseFile(tempFilepath);
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
    const creditsToDeduct = Math.max(
      0.01,
      Math.round(durationMinutes * 100) / 100
    );

    console.log(
      `💰 [${audioFileId}] Credits to deduct: ${creditsToDeduct}, Current credits: ${audioFile.user.credits}`
    );

    // Verificar se tem créditos suficientes
    if (audioFile.user.credits < creditsToDeduct) {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
      await unlink(tempFilepath).catch(() => {});
      console.error(`❌ Insufficient credits: ${audioFile.user.credits} < ${creditsToDeduct}`);
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

    // Debitar créditos
    const currentCredits = audioFile.user.credits;
    const newCredits = Math.max(0, currentCredits - creditsToDeduct);

    const updatedUser = await prisma.user.update({
      where: { id: audioFile.userId },
      data: {
        credits: Math.round(newCredits * 100) / 100,
      },
    });

    console.log(`💳 Credits updated: ${currentCredits} → ${updatedUser.credits}`);

    // Verificar se créditos estão baixos
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

    // Limpar arquivo temporário
    await unlink(tempFilepath).catch(() => {});

    // Gerar resumo com GPT (assíncrono, não bloqueia)
    generateSummary(transcriptionRecord.id, transcriptionText).catch(
      (error) => {
        console.error(`❌ [${audioFileId}] Error generating summary:`, error);
      }
    );

    console.log(`🎉 [${audioFileId}] Transcription process completed successfully!`);
    return transcriptionRecord;
  } catch (error: any) {
    console.error(`❌ [${audioFileId}] Error processing transcription:`, error);
    
    // Log estruturado do erro
    logTranscriptionError(audioFileId, error, {
      filepath: blobUrl,
      originalFilename,
    });

    // Marcar como erro no banco
    try {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
    } catch (updateError) {
      console.error("Error updating status:", updateError);
    }

    return null;
  }
}

async function generateSummary(
  transcriptionId: string,
  transcriptionText: string
) {
  try {
    const { openai } = await import("@/lib/openai");

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from GPT");
    }

    const summaryData = JSON.parse(responseContent);

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

    console.log(`✅ Summary generated for transcription ${transcriptionId}`);
  } catch (error) {
    console.error("Error generating summary:", error);
  }
}

