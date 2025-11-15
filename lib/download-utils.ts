// Utility functions for downloading transcriptions

export async function downloadTranscription(
  transcriptionId: string,
  format: "txt" | "json" | "srt" = "txt"
) {
  try {
    // Buscar a transcrição completa
    const response = await fetch(`/api/transcriptions/${transcriptionId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch transcription");
    }

    const transcription = await response.json();

    let blob: Blob;
    let extension: string;
    const filename = transcription.audioFile?.originalFilename || "transcription";

    switch (format) {
      case "json":
        const jsonContent = JSON.stringify(
          {
            transcription: transcription.text,
            metadata: {
              filename: transcription.audioFile?.originalFilename,
              duration: transcription.audioFile?.durationSeconds,
              credits: transcription.costCredits,
              createdAt: transcription.createdAt,
            },
            summary: transcription.summary,
          },
          null,
          2
        );
        blob = new Blob([jsonContent], { type: "application/json" });
        extension = "json";
        break;
      case "srt":
        const srtContent = generateSRT(
          transcription.text,
          transcription.audioFile?.durationSeconds || 0
        );
        blob = new Blob([srtContent], { type: "text/plain" });
        extension = "srt";
        break;
      default: // txt
        blob = new Blob([transcription.text], { type: "text/plain" });
        extension = "txt";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading transcription:", error);
    throw error;
  }
}

function generateSRT(text: string, durationSeconds: number) {
  // Dividir texto em sentenças para criar blocos de legenda
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return "";
  
  const blockDuration = durationSeconds / sentences.length;

  let srt = "";
  let currentTime = 0;

  sentences.forEach((sentence, index) => {
    const startTime = formatSRTTime(currentTime);
    currentTime += blockDuration;
    const endTime = formatSRTTime(currentTime);

    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${sentence.trim()}\n\n`;
  });

  return srt;
}

function formatSRTTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
}

