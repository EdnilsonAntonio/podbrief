import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { readFile, readdir, unlink, rmdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, filename, contentType, totalSize, totalChunks } = body;

    if (!uploadId || !filename || !contentType || !totalSize || !totalChunks) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Estimar créditos necessários
    const estimatedMinutes = totalSize / (1024 * 1024); // ~1MB por minuto
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

    // Diretório dos chunks
    const chunksDir = process.env.VERCEL 
      ? `/tmp/uploads/chunks/${uploadId}`
      : join(process.cwd(), "tmp", "uploads", "chunks", uploadId);

    if (!existsSync(chunksDir)) {
      return NextResponse.json(
        { error: "Chunks directory not found" },
        { status: 404 }
      );
    }

    // Verificar se todos os chunks estão presentes
    const chunkFiles = await readdir(chunksDir);
    const chunkIndices = chunkFiles
      .filter(f => f.startsWith("chunk-"))
      .map(f => parseInt(f.replace("chunk-", "")))
      .sort((a, b) => a - b);

    if (chunkIndices.length !== totalChunks) {
      return NextResponse.json(
        { 
          error: "Not all chunks received",
          received: chunkIndices.length,
          expected: totalChunks
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Recombining ${totalChunks} chunks for upload ${uploadId}`);

    // Recombinar chunks
    const chunks: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = join(chunksDir, `chunk-${i}`);
      if (!existsSync(chunkPath)) {
        throw new Error(`Chunk ${i} not found`);
      }
      const chunkData = await readFile(chunkPath);
      chunks.push(chunkData);
    }

    // Combinar todos os chunks em um único buffer
    const completeFile = Buffer.concat(chunks);
    console.log(`✅ File recombined: ${(completeFile.length / (1024 * 1024)).toFixed(2)}MB`);

    // Salvar arquivo completo no Vercel Blob
    const uniqueFilename = `audio/${user.id}-${Date.now()}-${filename}`;
    
    // Verificar se o token está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not configured. Please add it to your Vercel project settings.");
    }
    
    const { url } = await put(uniqueFilename, completeFile, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`💾 File saved to Blob: ${url}`);

    // Limpar chunks
    try {
      for (const chunkFile of chunkFiles) {
        await unlink(join(chunksDir, chunkFile));
      }
      await rmdir(chunksDir);
      console.log(`🧹 Cleaned up chunks directory for ${uploadId}`);
    } catch (cleanupError) {
      console.warn("Error cleaning up chunks:", cleanupError);
      // Não falhar se não conseguir limpar
    }

    // Criar registro no banco de dados
    const audioFile = await prisma.audioFile.create({
      data: {
        userId: user.id,
        url: url, // URL do Blob Storage
        originalFilename: filename,
        sizeBytes: totalSize,
        durationSeconds: null,
        status: "pending",
      },
    });

    console.log(`🚀 Starting transcription processing for audioFile ${audioFile.id} (from chunks)`);
    
    // Processar transcrição de forma assíncrona mas garantindo execução
    // No Vercel, precisamos garantir que o processamento continue mesmo após a resposta
    const processPromise = import("@/lib/transcription/process-blob").then(({ processTranscriptionFromBlob }) => {
      return processTranscriptionFromBlob(audioFile.id, url, filename);
    }).catch((error) => {
      console.error(`❌ [${audioFile.id}] Error processing transcription from blob:`, error);
      // Atualizar status para error se falhar
      prisma.audioFile.update({
        where: { id: audioFile.id },
        data: { status: "error" },
      }).catch((updateError) => {
        console.error("Error updating status to error:", updateError);
      });
    });
    
    // Não aguardar o processamento, mas garantir que a promise seja mantida
    // O Vercel manterá a função ativa enquanto houver trabalho pendente
    processPromise.catch(() => {}); // Evitar unhandled rejection

    return NextResponse.json({
      success: true,
      audioFileId: audioFile.id,
      message: "File uploaded and recombined successfully. Processing started.",
    });
  } catch (error: any) {
    console.error("Complete upload error:", error);
    return NextResponse.json(
      { error: "Failed to complete upload", message: error.message },
      { status: 500 }
    );
  }
}

