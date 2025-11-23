import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import YtDlpWrap from "yt-dlp-wrap";
import { unlink } from "fs/promises";
import { createReadStream } from "fs";
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
    videoTitle: videoInfo.title || videoInfo.fulltitle || "Unknown",
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

    // Usar yt-dlp-wrap para obter informações e baixar o áudio
    const ytDlpWrap = new YtDlpWrap();
    
    // Obter informações do vídeo usando yt-dlp
    let videoInfo: any;
    let videoDuration = 0;
    let videoDurationMinutes = 0;
    
    try {
      console.log(`📊 Getting video info for ${videoId}...`);
      const info = await ytDlpWrap.getVideoInfo(url);
      videoInfo = info;
      videoDuration = info.duration || 0;
      videoDurationMinutes = videoDuration / 60;
      
      console.log(`✅ Video info retrieved: ${info.title}, Duration: ${videoDurationMinutes.toFixed(2)} min`);
    } catch (error: any) {
      console.error("Error fetching video info with yt-dlp:", error);
      
      // Se o erro for relacionado a bot detection
      if (error.message?.includes("Sign in to confirm") || 
          error.message?.includes("bot") ||
          error.stderr?.includes("Sign in to confirm")) {
        return NextResponse.json(
          { 
            error: "YouTube bot detection",
            message: "YouTube is currently blocking automated access. Please try again later or use a different video. If the problem persists, you can download the audio manually and upload it to transcribe.",
            code: "BOT_DETECTION"
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch video information",
          message: error.message || "The video may be private, unavailable, or YouTube is blocking access. Please try downloading the audio manually and uploading it.",
          code: "FETCH_ERROR"
        },
        { status: 400 }
      );
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

    const tempFilepath = join(tempDir, `youtube-${videoId}-${Date.now()}.%(ext)s`);

    try {
      // Baixar áudio do vídeo usando yt-dlp
      console.log(`⬇️ Downloading audio for video ${videoId}...`);
      
      await ytDlpWrap.execPromise([
        url,
        '-f', 'bestaudio/best',
        '-x', // Extract audio
        '--audio-format', 'mp3',
        '--audio-quality', '0', // Best quality
        '-o', tempFilepath,
        '--no-playlist',
        '--quiet',
        '--no-warnings',
      ]);

      // yt-dlp adiciona a extensão ao arquivo, então precisamos encontrar o arquivo real
      const actualFilepath = tempFilepath.replace('%(ext)s', 'mp3');
      let downloadedFilePath: string;
      
      if (existsSync(actualFilepath)) {
        downloadedFilePath = actualFilepath;
      } else {
        // Tentar encontrar o arquivo com qualquer extensão
        const files = await import("fs/promises");
        const dirFiles = await files.readdir(tempDir);
        const downloadedFile = dirFiles.find(f => f.startsWith(`youtube-${videoId}-`));
        if (!downloadedFile) {
          throw new Error("Downloaded file not found");
        }
        downloadedFilePath = join(tempDir, downloadedFile);
      }
      
      console.log(`✅ Audio downloaded: ${downloadedFilePath}`);
      
      // Processar áudio e gerar capítulos
      const result = await processAudioAndGenerateChapters(
        downloadedFilePath,
        videoDuration,
        videoInfo,
        user,
        userData,
        videoDurationMinutes
      );
      
      return NextResponse.json(result);
    } catch (error: any) {
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
          message: error.message || "An error occurred while processing the video",
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

