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
    
    // Verificar se o status já está como "processing" (pode ter sido atualizado no endpoint)
    // Se não estiver, atualizar para processing
    const currentAudioFile = await prisma.audioFile.findUnique({
      where: { id: audioFileId },
      select: { status: true },
    });
    
    if (currentAudioFile?.status !== "processing") {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "processing" },
      });
      console.log(`✅ [${audioFileId}] Status updated to processing`);
    } else {
      console.log(`ℹ️ [${audioFileId}] Status already set to processing`);
    }

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
    console.log(`⬇️ [${audioFileId}] Downloading file from Blob: ${blobUrl}`);
    const downloadStartTime = Date.now();
    
    let buffer: Buffer;
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        console.error(`❌ [${audioFileId}] Blob download failed: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to download file from Blob: ${response.status} ${response.statusText}`);
      }
      
      console.log(`📥 [${audioFileId}] Blob response OK, reading arrayBuffer...`);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      const downloadTime = ((Date.now() - downloadStartTime) / 1000).toFixed(2);
      console.log(`✅ [${audioFileId}] File downloaded in ${downloadTime}s, size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`);
    } catch (downloadError: any) {
      console.error(`❌ [${audioFileId}] Error downloading from Blob:`, downloadError);
      throw new Error(`Failed to download file from Blob: ${downloadError.message}`);
    }

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

    // Extrair o texto e idioma da transcrição
    const transcriptionText = (transcriptionResponse as any).text;
    const detectedLanguage = (transcriptionResponse as any).language || null;
    console.log(`📄 [${audioFileId}] Transcription text length: ${transcriptionText.length} characters`);
    console.log(`🌐 [${audioFileId}] Detected language: ${detectedLanguage || "unknown"}`);

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
    // Usar Math.round para arredondar para o centésimo mais próximo
    // Isso é mais justo: 10.00 minutos = 10.00 créditos, 10.01 minutos = 10.01 créditos
    // Math.ceil estava sendo muito agressivo (10.005 minutos = 10.01 créditos)
    const creditsToDeduct = Math.max(
      0.01,
      Math.round(durationMinutes * 100) / 100
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
    // Passar o idioma detectado para gerar o resumo no mesmo idioma
    generateSummary(transcriptionRecord.id, transcriptionText, detectedLanguage).catch(
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
  transcriptionText: string,
  detectedLanguage: string | null = null
) {
  try {
    const { openai } = await import("@/lib/openai");

    // Mapear códigos de idioma para nomes completos (para instruções mais claras)
    const languageMap: Record<string, string> = {
      en: "English",
      pt: "Portuguese",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      ru: "Russian",
      ar: "Arabic",
      hi: "Hindi",
      nl: "Dutch",
      sv: "Swedish",
      pl: "Polish",
      tr: "Turkish",
    };

    const languageName = detectedLanguage ? languageMap[detectedLanguage] || detectedLanguage : null;
    const languageInstruction = languageName 
      ? `IMPORTANT: The transcription is in ${languageName} (${detectedLanguage}). You MUST generate the summary, bullet points, and keywords in the SAME language (${languageName}). Do not translate to English.`
      : "Generate the summary in the same language as the transcription.";

    const prompt = `Analyze the following transcription and provide a comprehensive summary. ${languageInstruction}

Return your response as a JSON object with the following structure:
{
  "shortSummary": "A brief 2-3 sentence summary (in the same language as the transcription)",
  "longSummary": "A detailed paragraph summary (4-5 sentences, in the same language as the transcription)",
  "bulletPoints": "Key points separated by newlines (one per line, in the same language as the transcription)",
  "keywords": "Comma-separated list of important keywords (in the same language as the transcription)",
  "sentiment": "positive, negative, or neutral",
  "language": "Language code (e.g., 'en', 'pt', 'es') - must match the transcription language"
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
            `You are a helpful assistant that analyzes transcriptions and provides structured summaries in JSON format. ${languageInstruction} Always maintain the original language of the transcription in your summaries.`,
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

    // Usar o idioma detectado se o GPT não retornou ou se retornou diferente
    const finalLanguage = detectedLanguage || summaryData.language || null;

    await prisma.summary.create({
      data: {
        transcriptionId: transcriptionId,
        shortSummary: summaryData.shortSummary || null,
        longSummary: summaryData.longSummary || null,
        bulletPoints: summaryData.bulletPoints || null,
        keywords: summaryData.keywords || null,
        sentiment: summaryData.sentiment || null,
        language: finalLanguage,
      },
    });

    console.log(`✅ Summary generated for transcription ${transcriptionId} in language: ${finalLanguage}`);
  } catch (error) {
    console.error("Error generating summary:", error);
  }
}

