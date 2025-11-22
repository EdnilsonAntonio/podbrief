import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Buscar o arquivo de áudio
    const audioFile = await prisma.audioFile.findUnique({
      where: { id },
      include: {
        transcription: true,
      },
    });

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file not found" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono
    if (audioFile.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determinar o tipo MIME baseado na extensão
    const filename = audioFile.originalFilename || "";
    let contentType = "audio/mpeg"; // Default
    if (filename.endsWith(".wav")) contentType = "audio/wav";
    else if (filename.endsWith(".m4a")) contentType = "audio/mp4";
    else if (filename.endsWith(".ogg")) contentType = "audio/ogg";
    else if (filename.endsWith(".flac")) contentType = "audio/flac";
    else if (filename.endsWith(".webm")) contentType = "audio/webm";

    // Verificar se é uma URL do Blob (começa com https://) ou caminho local
    let fileBuffer: Buffer;
    
    if (audioFile.url.startsWith("https://")) {
      // É uma URL do Vercel Blob - fazer fetch direto (URLs públicas são acessíveis)
      console.log(`📥 Fetching audio from Blob: ${audioFile.url}`);
      console.log(`📋 AudioFile ID: ${audioFile.id}, User ID: ${user.id}`);
      
      try {
        // Fazer fetch direto da URL pública do Blob
        // URLs públicas do Vercel Blob são acessíveis via HTTP direto
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        const response = await fetch(audioFile.url, {
          method: "GET",
          headers: {
            "Accept": "*/*",
            "User-Agent": "PodBrief-Audio-Server/1.0",
          },
          signal: controller.signal,
          // Não seguir redirects automaticamente - queremos ver o status real
          redirect: "manual",
        });
        
        clearTimeout(timeoutId);
        
        // Se for redirect, seguir manualmente
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (location) {
            console.log(`🔄 Following redirect to: ${location}`);
            const redirectResponse = await fetch(location, {
              method: "GET",
              headers: {
                "Accept": "*/*",
                "User-Agent": "PodBrief-Audio-Server/1.0",
              },
              signal: controller.signal,
            });
            
            if (!redirectResponse.ok) {
              throw new Error(`Redirect failed: ${redirectResponse.status} ${redirectResponse.statusText}`);
            }
            
            const arrayBuffer = await redirectResponse.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
            console.log(`✅ Audio fetched from Blob (via redirect), size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
          } else {
            throw new Error("Redirect location not found");
          }
        } else if (!response.ok) {
          console.error(`❌ Failed to fetch from Blob: ${response.status} ${response.statusText}`);
          console.error(`❌ Response headers:`, Object.fromEntries(response.headers.entries()));
          
          // Se for 404, o arquivo realmente não existe
          if (response.status === 404) {
            return NextResponse.json(
              { 
                error: "Audio file no longer available",
                message: "The audio file was not found in storage. It may have been deleted or expired.",
                audioFileId: audioFile.id,
                url: audioFile.url
              },
              { status: 404 }
            );
          }
          
          // Outros erros
          return NextResponse.json(
            { 
              error: "Failed to fetch audio file",
              message: `Server returned ${response.status}: ${response.statusText}`,
              audioFileId: audioFile.id
            },
            { status: response.status }
          );
        } else {
          // Sucesso - ler o conteúdo
          const arrayBuffer = await response.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
          console.log(`✅ Audio fetched from Blob, size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
        }
      } catch (fetchError: any) {
        console.error("❌ Error fetching from Blob:", fetchError);
        console.error("❌ Error name:", fetchError.name);
        console.error("❌ Error message:", fetchError.message);
        console.error("❌ Error stack:", fetchError.stack);
        
        // Se foi timeout
        if (fetchError.name === "AbortError") {
          return NextResponse.json(
            { 
              error: "Request timeout",
              message: "The request to fetch the audio file timed out. Please try again.",
              audioFileId: audioFile.id
            },
            { status: 504 }
          );
        }
        
        // Se for erro de rede ou conexão
        if (fetchError.message?.includes("ECONNREFUSED") || fetchError.message?.includes("ENOTFOUND") || fetchError.message?.includes("network")) {
          return NextResponse.json(
            { 
              error: "Network error",
              message: "Failed to connect to storage. Please try again later.",
              audioFileId: audioFile.id,
              url: audioFile.url
            },
            { status: 503 }
          );
        }
        
        // Outros erros
        return NextResponse.json(
          { 
            error: "Failed to fetch audio file",
            message: fetchError.message || "Error while fetching audio file from storage",
            audioFileId: audioFile.id,
            url: audioFile.url
          },
          { status: 500 }
        );
      }
    } else {
      // É um caminho local - ler do sistema de arquivos
      console.log(`📂 Reading audio from local path: ${audioFile.url}`);
      if (!existsSync(audioFile.url)) {
        console.error(`❌ Local file not found: ${audioFile.url}`);
        return NextResponse.json(
          { 
            error: "Audio file no longer available",
            message: "The audio file was not found on the server.",
            audioFileId: audioFile.id,
            path: audioFile.url
          },
          { status: 404 }
        );
      }
      fileBuffer = await readFile(audioFile.url);
      console.log(`✅ Audio read from local path, size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
    }

    // Retornar o arquivo com headers apropriados
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${audioFile.originalFilename || "audio"}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving audio file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

