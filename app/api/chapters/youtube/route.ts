import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import ytdl from "@distube/ytdl-core";
import { unlink, writeFile } from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { openai } from "@/lib/openai";

// Função para extrair o ID do vídeo do YouTube
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Função para formatar tempo em HH:MM:SS ou MM:SS
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Função para gerar capítulos usando GPT
async function generateChapters(
  transcriptionText: string,
  videoDuration: number,
  detectedLanguage: string | null
): Promise<string> {
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

  const languageName = detectedLanguage ? languageMap[detectedLanguage] || detectedLanguage : "the same language as the transcription";
  const languageInstruction = detectedLanguage
    ? `The transcription is in ${languageName}. Generate chapter titles in ${languageName}.`
    : "Generate chapter titles in the same language as the transcription.";

  const prompt = `Analyze the following video transcription and generate chapters with timestamps in the standard YouTube format.

${languageInstruction}

The video duration is approximately ${Math.round(videoDuration / 60)} minutes.

Return ONLY the chapters in the following format (one chapter per line):
00:00 Chapter Title 1
05:23 Chapter Title 2
12:45 Chapter Title 3
...

Requirements:
- Generate 5-15 chapters depending on video length
- Each chapter should be 2-10 minutes long (adjust based on total duration)
- Chapter titles should be clear, descriptive, and engaging
- Start with 00:00
- Use timestamps in MM:SS or HH:MM:SS format
- Do not include any text before or after the chapters list
- Each line should be: TIMESTAMP Chapter Title

Transcription:
${transcriptionText.substring(0, 20000)}${transcriptionText.length > 20000 ? "..." : ""}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that analyzes video transcriptions and generates chapter markers with timestamps for YouTube videos. ${languageInstruction} Always generate chapters in the exact format specified.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error("No response from GPT");
  }

  // Limpar a resposta e garantir que está no formato correto
  let chapters = responseContent.trim();
  
  // Remover qualquer texto antes do primeiro timestamp
  const firstTimestampMatch = chapters.match(/^\d{1,2}:\d{2}(:\d{2})?/m);
  if (firstTimestampMatch) {
    const firstTimestampIndex = chapters.indexOf(firstTimestampMatch[0]);
    if (firstTimestampIndex > 0) {
      chapters = chapters.substring(firstTimestampIndex);
    }
  }

  // Garantir que começa com 00:00
  if (!chapters.startsWith("00:00") && !chapters.startsWith("0:00")) {
    chapters = "00:00 " + chapters.split("\n")[0] + "\n" + chapters;
  }

  return chapters.trim();
}

// Função auxiliar para processar transcrição e gerar capítulos
async function processAudioAndGenerateChapters(
  audioFilePath: string,
  videoDuration: number,
  videoInfo: any,
  user: any,
  userData: any,
  videoDurationMinutes: number
) {
  const fileStream = createReadStream(audioFilePath);
  const transcriptionResponse = await openai.audio.transcriptions.create({
    file: fileStream as any,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  const transcriptionText = (transcriptionResponse as any).text;
  const detectedLanguage = (transcriptionResponse as any).language || null;

  console.log(`✅ Transcription completed. Language: ${detectedLanguage || "unknown"}`);

  // Gerar capítulos
  console.log(`📝 Generating chapters...`);
  const chapters = await generateChapters(transcriptionText, videoDuration, detectedLanguage);

  // Debitar créditos
  const creditsToDeduct = Math.max(
    0.01,
    Math.round(videoDurationMinutes * 100) / 100
  );

  const newCredits = Math.max(0, userData.credits - creditsToDeduct);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      credits: Math.round(newCredits * 100) / 100,
    },
  });

  console.log(`💳 Credits deducted: ${creditsToDeduct}. New balance: ${newCredits}`);

  // Limpar arquivo temporário
  await unlink(audioFilePath).catch(() => {});

  return {
    success: true,
    chapters,
    videoTitle: videoInfo.videoDetails?.title || videoInfo.title || videoInfo.fulltitle || "Unknown",
    videoDuration: videoDuration,
    videoDurationMinutes: Math.round(videoDurationMinutes),
    creditsUsed: creditsToDeduct,
    language: detectedLanguage,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validar URL do YouTube
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    console.log(`🎬 Processing YouTube video: ${videoId} for user ${user.id}`);

    // Verificar créditos do usuário
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    if (!userData || userData.credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // Criar diretório temporário se não existir
    const tempDir = process.env.VERCEL ? "/tmp" : join(process.cwd(), "tmp", "youtube");
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Mudar para o diretório temporário para que arquivos de debug sejam salvos lá
    const originalCwd = process.cwd();
    let cwdChanged = false;
    try {
      if (process.env.VERCEL) {
        process.chdir("/tmp");
        cwdChanged = true;
      }
    } catch (e) {
      console.warn("Could not change directory for ytdl debug files:", e);
    }

    // Obter informações do vídeo usando ytdl-core
    let videoInfo: any;
    let videoDuration = 0;
    let videoDurationMinutes = 0;
    
    try {
      console.log(`📊 Getting video info for ${videoId}...`);
      videoInfo = await ytdl.getInfo(videoId, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Referer': 'https://www.youtube.com/',
            'Origin': 'https://www.youtube.com',
          },
        },
      });
      
      videoDuration = videoInfo.videoDetails.lengthSeconds
        ? parseInt(videoInfo.videoDetails.lengthSeconds)
        : 0;
      videoDurationMinutes = videoDuration / 60;
      
      console.log(`✅ Video info retrieved: ${videoInfo.videoDetails.title}, Duration: ${videoDurationMinutes.toFixed(2)} min`);
    } catch (error: any) {
      console.error("Error fetching video info:", error);
      
      // Restaurar diretório original
      if (cwdChanged) {
        try {
          process.chdir(originalCwd);
        } catch (e) {}
      }
      
      // Se o erro for relacionado a bot detection
      if (error.message?.includes("Sign in to confirm") || 
          error.message?.includes("bot") ||
          error.message?.includes("confirm you're not a bot")) {
        return NextResponse.json(
          { 
            error: "YouTube bot detection",
            message: "YouTube is currently blocking automated access. Please try again later or use a different video. If the problem persists, you can download the audio manually and upload it to transcribe.",
            code: "BOT_DETECTION"
          },
          { status: 403 }
        );
      }
      
      // Se o erro for relacionado a parsing do HTML
      if (error.message?.includes("parsing watch.html") || 
          error.message?.includes("YouTube made a change")) {
        return NextResponse.json(
          { 
            error: "YouTube structure changed",
            message: "YouTube has changed its structure and our parser needs to be updated. Please download the audio file manually from YouTube and upload it using the 'Upload Audio' feature to generate chapters.",
            code: "PARSING_ERROR"
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch video information",
          message: "Unable to access YouTube video. This may be due to YouTube restrictions or changes. Please download the audio file manually from YouTube and upload it using the 'Upload Audio' feature to generate chapters.",
          code: "FETCH_ERROR"
        },
        { status: 400 }
      );
    } finally {
      // Restaurar diretório original
      if (cwdChanged) {
        try {
          process.chdir(originalCwd);
        } catch (e) {}
      }
    }

    // Estimar créditos necessários
    const estimatedCredits = Math.max(0.01, Math.round(videoDurationMinutes * 100) / 100);

    if (userData.credits < estimatedCredits) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: `This video is approximately ${Math.round(videoDurationMinutes)} minutes long and requires ${estimatedCredits} credits. You currently have ${userData.credits} credits.`,
          estimatedCredits,
          videoDurationMinutes: Math.round(videoDurationMinutes),
        },
        { status: 400 }
      );
    }

    const tempFilepath = join(tempDir, `youtube-${videoId}-${Date.now()}.mp3`);

    try {
      // Mudar para o diretório temporário novamente para o download
      if (process.env.VERCEL) {
        try {
          process.chdir("/tmp");
        } catch (e) {}
      }

      // Baixar áudio do vídeo usando ytdl-core
      console.log(`⬇️ Downloading audio for video ${videoId}...`);
      
      const audioStream = ytdl(videoId, {
        quality: "lowestaudio",
        filter: "audioonly",
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Referer': 'https://www.youtube.com/',
            'Origin': 'https://www.youtube.com',
          },
        },
      });

      const writeStream = createWriteStream(tempFilepath);
      await pipeline(audioStream, writeStream);

      // Restaurar diretório original
      if (process.env.VERCEL) {
        try {
          process.chdir(originalCwd);
        } catch (e) {}
      }

      console.log(`✅ Audio downloaded: ${tempFilepath}`);
      
      // Processar áudio e gerar capítulos
      const result = await processAudioAndGenerateChapters(
        tempFilepath,
        videoDuration,
        videoInfo,
        user,
        userData,
        videoDurationMinutes
      );
      
      return NextResponse.json(result);
    } catch (error: any) {
      // Restaurar diretório original em caso de erro
      if (process.env.VERCEL) {
        try {
          process.chdir(originalCwd);
        } catch (e) {}
      }

      // Limpar arquivo temporário em caso de erro
      await unlink(tempFilepath).catch(() => {});
      console.error("Error processing YouTube video:", error);
      
      // Verificar se é erro de bot detection durante o download
      if (error.message?.includes("Sign in to confirm") || 
          error.message?.includes("bot") ||
          error.message?.includes("confirm you're not a bot")) {
        return NextResponse.json(
          {
            error: "YouTube bot detection",
            message: "YouTube is currently blocking automated access. Please try again later or use a different video. If the problem persists, you can download the audio manually and upload it to transcribe.",
            code: "BOT_DETECTION"
          },
          { status: 403 }
        );
      }
      
      // Verificar se é erro de parsing
      if (error.message?.includes("parsing watch.html") || 
          error.message?.includes("YouTube made a change")) {
        return NextResponse.json(
          {
            error: "YouTube structure changed",
            message: "YouTube has changed its structure and our parser needs to be updated. Please download the audio file manually from YouTube and upload it using the 'Upload Audio' feature to generate chapters.",
            code: "PARSING_ERROR"
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        {
          error: "Failed to process video",
          message: error.message || "An error occurred while processing the video. Please try downloading the audio manually and uploading it.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in YouTube chapters API:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

