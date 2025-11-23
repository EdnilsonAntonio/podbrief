"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, Check, Youtube, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

type ProcessingStage = "idle" | "downloading" | "transcribing" | "creating" | "completed" | "error";

export default function ChaptersPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [url, setUrl] = useState("");
  const [chapters, setChapters] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    title?: string;
    duration?: number;
    creditsUsed?: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError(t("chapters.urlRequired"));
      return;
    }

    // Validar URL do YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      setError(t("chapters.invalidUrl"));
      return;
    }

    setIsProcessing(true);
    setError(null);
    setChapters("");
    setVideoInfo(null);
    setProcessingStage("downloading");

    try {
      const response = await fetch("/api/chapters/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se for erro de bot detection, usar mensagem específica
        if (data.code === "BOT_DETECTION") {
          throw new Error(data.message || t("chapters.botDetectionMessage"));
        }
        throw new Error(data.message || data.error || t("chapters.error"));
      }

      setChapters(data.chapters);
      setVideoInfo({
        title: data.videoTitle,
        duration: data.videoDurationMinutes,
        creditsUsed: data.creditsUsed,
      });
      setProcessingStage("completed");
      toast.success(t("chapters.chaptersReady"));
    } catch (err: any) {
      console.error("Error generating chapters:", err);
      setError(err.message || t("chapters.error"));
      setProcessingStage("error");
      toast.error(err.message || t("chapters.error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!chapters) return;

    try {
      await navigator.clipboard.writeText(chapters);
      setCopied(true);
      toast.success(t("chapters.chaptersCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy chapters");
    }
  };

  const getStageMessage = () => {
    switch (processingStage) {
      case "downloading":
        return t("chapters.downloading");
      case "transcribing":
        return t("chapters.transcribing");
      case "creating":
        return t("chapters.creatingChapters");
      case "completed":
        return t("chapters.chaptersReady");
      case "error":
        return t("chapters.error");
      default:
        return t("chapters.generating");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("chapters.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("chapters.description")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              {t("chapters.enterUrl")}
            </CardTitle>
            <CardDescription>{t("chapters.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder={t("chapters.urlPlaceholder")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isProcessing && url.trim()) {
                    handleGenerate();
                  }
                }}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {error.includes("bot") || error.includes("blocking") 
                        ? t("chapters.botDetectionError")
                        : t("chapters.error")}
                    </p>
                    <p className="text-sm">{error}</p>
                    {(error.includes("bot") || error.includes("blocking")) && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded">
                        {t("chapters.alternativeSolution")}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isProcessing || !url.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {getStageMessage()}
                </>
              ) : (
                t("chapters.generateChapters")
              )}
            </Button>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{getStageMessage()}</span>
                </div>
              </div>
            )}

            {videoInfo && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {videoInfo.title && (
                      <p className="font-semibold">{videoInfo.title}</p>
                    )}
                    {videoInfo.duration && (
                      <p className="text-sm">
                        {t("chapters.videoDuration", {
                          duration: `${videoInfo.duration} ${t("transcription.minutes")}`,
                        })}
                      </p>
                    )}
                    {videoInfo.creditsUsed && (
                      <p className="text-sm">
                        {t("transcription.credits")}: {videoInfo.creditsUsed.toFixed(2)}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("chapters.chaptersFormat")}</CardTitle>
            <CardDescription>{t("chapters.chaptersFormatDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chapters-output">Chapters</Label>
                {chapters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        {t("common.copy")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {t("chapters.copyChapters")}
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Textarea
                id="chapters-output"
                placeholder={t("chapters.chaptersReady")}
                value={chapters}
                onChange={(e) => setChapters(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                readOnly={!chapters}
              />
            </div>

            {chapters && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {t("chapters.note")}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>{t("chapters.howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">{t("chapters.step1Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("chapters.step1Description")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("chapters.step2Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("chapters.step2Description")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("chapters.step3Title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("chapters.step3Description")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

