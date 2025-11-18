import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { logTranscriptionError, LogLevel, log } from "@/lib/monitoring";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioFileId } = body;

    if (!audioFileId) {
      return NextResponse.json(
        { error: "audioFileId is required" },
        { status: 400 }
      );
    }

    console.log(`📝 Processing transcription for audioFile ${audioFileId}`);

    // Buscar o arquivo de áudio
    const audioFile = await prisma.audioFile.findUnique({
      where: { id: audioFileId },
      include: { user: true },
    });

    if (!audioFile) {
      console.error(`❌ Audio file ${audioFileId} not found`);
      return NextResponse.json(
        { error: "Audio file not found" },
        { status: 404 }
      );
    }

    // Verificar se já está processado
    if (audioFile.status === "completed") {
      console.log(`✅ Audio file ${audioFileId} already completed`);
      return NextResponse.json({ message: "Already processed" });
    }

    // Verificar se já está em processamento
    if (audioFile.status === "processing") {
      console.log(`⏳ Audio file ${audioFileId} already processing`);
      return NextResponse.json({ message: "Already processing" });
    }

    // Atualizar status para processing
    await prisma.audioFile.update({
      where: { id: audioFileId },
      data: { status: "processing" },
    });

    console.log(`🔄 Status updated to processing for audioFile ${audioFileId}`);

    // Verificar créditos
    if (audioFile.user.credits <= 0) {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
      await unlink(audioFile.url).catch(() => {});
      console.error(`❌ Insufficient credits for audioFile ${audioFileId}`);
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // Verificar se o arquivo existe
    if (!existsSync(audioFile.url)) {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
      console.error(`❌ File not found: ${audioFile.url}`);
      return NextResponse.json(
        { error: "Audio file not found on disk" },
        { status: 404 }
      );
    }

    console.log(`📂 Reading file from: ${audioFile.url}`);

    // Importar OpenAI e fs
    const { openai } = await import("@/lib/openai");
    const fs = await import("fs");
    const { createReadStream } = fs;

    // Ler o arquivo como stream
    const fileStream = createReadStream(audioFile.url);

    console.log(`🎤 Calling OpenAI Whisper API for audioFile ${audioFileId}`);

    // Chamar Whisper API
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fileStream as any,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    console.log(`✅ Transcription received for audioFile ${audioFileId}`);

    // Extrair o texto da transcrição
    const transcriptionText = (transcriptionResponse as any).text;

    // Obter duração real do áudio
    let durationSeconds = null;
    let durationMinutes = 0.01;

    try {
      const { parseFile } = await import("music-metadata");
      const metadata = await parseFile(audioFile.url);
      if (metadata.format.duration) {
        durationSeconds = metadata.format.duration;
        durationMinutes = durationSeconds / 60;
      }
      console.log(`⏱️ Duration extracted: ${durationSeconds}s (${durationMinutes.toFixed(2)} min)`);
    } catch (metadataError) {
      console.warn("Could not extract audio duration, using estimation:", metadataError);
      const estimatedMinutes = (audioFile.sizeBytes || 0) / (1024 * 1024);
      durationMinutes = Math.max(0.01, estimatedMinutes);
    }

    // Calcular créditos
    const creditsToDeduct = Math.max(
      0.01,
      Math.round(durationMinutes * 100) / 100
    );

    console.log(
      `💰 Credits to deduct: ${creditsToDeduct}, Current credits: ${audioFile.user.credits}`
    );

    // Verificar se tem créditos suficientes
    if (audioFile.user.credits < creditsToDeduct) {
      await prisma.audioFile.update({
        where: { id: audioFileId },
        data: { status: "error" },
      });
      await unlink(audioFile.url).catch(() => {});
      console.error(`❌ Insufficient credits: ${audioFile.user.credits} < ${creditsToDeduct}`);
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
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

    console.log(`💾 Transcription record created: ${transcriptionRecord.id}`);

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

    console.log(`✅ Transcription completed for audioFile ${audioFileId}`);

    // Gerar resumo com GPT (assíncrono, não bloqueia)
    generateSummary(transcriptionRecord.id, transcriptionText).catch(
      (error) => {
        console.error("Error generating summary:", error);
      }
    );

    return NextResponse.json({
      success: true,
      transcriptionId: transcriptionRecord.id,
      message: "Transcription processed successfully",
    });
  } catch (error: any) {
    console.error("❌ Error processing transcription:", error);
    
    const body = await request.json().catch(() => ({}));
    const audioFileId = body.audioFileId;

    if (audioFileId) {
      // Log estruturado do erro
      logTranscriptionError(audioFileId, error, {
        filepath: "unknown",
        originalFilename: "unknown",
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
    }

    return NextResponse.json(
      {
        error: "Failed to process transcription",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

