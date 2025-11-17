"use client";

import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Copy, Download, Share2, Clock, CreditCard, Calendar, Loader2, Play, Pause, FileText, FileJson, Link2, Check } from "lucide-react";
import { format } from "date-fns";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TranscriptionData {
    id: string;
    text: string;
    costCredits: number;
    createdAt: Date;
    isPublic: boolean;
    shareToken: string | null;
    audioFile: {
        id: string;
        originalFilename: string | null;
        durationSeconds: number | null;
        createdAt: Date;
    };
    summary: {
        bulletPoints: string | null;
        keywords: string | null;
        sentiment: string | null;
        shortSummary: string | null;
        longSummary: string | null;
        language: string | null;
    } | null;
}

async function fetchTranscription(id: string): Promise<TranscriptionData> {
    const response = await fetch(`/api/transcriptions/${id}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Transcription not found");
        }
        throw new Error("Failed to fetch transcription");
    }
    return response.json();
}

export default function TranscriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: transcription, isLoading, error } = useQuery({
        queryKey: ["transcription", id],
        queryFn: () => fetchTranscription(id),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !transcription) {
        notFound();
    }

    return <TranscriptionContent transcription={transcription} />;
}

function AudioPlayer({ audioFileId, filename }: { audioFileId: string; filename: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const audioUrl = `/api/audio/${audioFileId}`;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };
        const handleError = () => {
            setError("Audio file not available");
            setIsLoading(false);
        };
        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("error", handleError);
        audio.addEventListener("loadstart", handleLoadStart);
        audio.addEventListener("canplay", handleCanPlay);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("error", handleError);
            audio.removeEventListener("loadstart", handleLoadStart);
            audio.removeEventListener("canplay", handleCanPlay);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (value: number[]) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (error) {
        return (
            <div className="rounded-lg border bg-muted p-8 text-center">
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                    The audio file may have been deleted or is no longer available.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="h-12 w-12"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="h-5 w-5" />
                    ) : (
                        <Play className="h-5 w-5" />
                    )}
                </Button>
                <div className="flex-1 space-y-2">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        disabled={isLoading || duration === 0}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
                {filename}
            </p>
        </div>
    );
}

function TranscriptionContent({ transcription }: { transcription: TranscriptionData }) {
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [isPublic, setIsPublic] = useState(transcription.isPublic || false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isLoadingShare, setIsLoadingShare] = useState(false);

    // Buscar status de compartilhamento ao carregar
    const { data: shareStatus } = useQuery({
        queryKey: ["share-status", transcription.id],
        queryFn: async () => {
            const response = await fetch(`/api/transcriptions/${transcription.id}/share`);
            if (!response.ok) return null;
            return response.json();
        },
        enabled: isShareDialogOpen,
    });

    // Atualizar estado quando shareStatus mudar
    useEffect(() => {
        if (shareStatus) {
            setIsPublic(shareStatus.isPublic || false);
            setShareUrl(shareStatus.shareUrl || null);
        }
    }, [shareStatus]);

    const handleToggleShare = async (enabled: boolean) => {
        setIsLoadingShare(true);
        try {
            const response = await fetch(`/api/transcriptions/${transcription.id}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enable: enabled }),
            });

            if (!response.ok) {
                throw new Error("Failed to update share status");
            }

            const data = await response.json();
            setIsPublic(enabled);
            setShareUrl(data.shareUrl || null);
            toast.success(enabled ? "Transcription is now public" : "Transcription is now private");
        } catch (error) {
            console.error("Error toggling share:", error);
            toast.error("Failed to update share status");
        } finally {
            setIsLoadingShare(false);
        }
    };

    const handleCopyShareLink = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            toast.success("Share link copied to clipboard!");
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleDownload = (content: string, filename: string, format: "txt" | "json" | "srt" = "txt") => {
        let blob: Blob;
        let mimeType: string;
        let extension: string;

        switch (format) {
            case "json":
                const jsonContent = JSON.stringify(
                    {
                        transcription: content,
                        metadata: {
                            filename: transcription.audioFile.originalFilename,
                            duration: transcription.audioFile.durationSeconds,
                            credits: transcription.costCredits,
                            createdAt: transcription.createdAt,
                        },
                        summary: transcription.summary,
                    },
                    null,
                    2
                );
                blob = new Blob([jsonContent], { type: "application/json" });
                mimeType = "application/json";
                extension = "json";
                break;
            case "srt":
                // Gerar formato SRT básico (legendas)
                const srtContent = generateSRT(content, transcription.audioFile.durationSeconds || 0);
                blob = new Blob([srtContent], { type: "text/plain" });
                mimeType = "text/plain";
                extension = "srt";
                break;
            default: // txt
                blob = new Blob([content], { type: "text/plain" });
                mimeType = "text/plain";
                extension = "txt";
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Downloaded as ${extension.toUpperCase()}`);
    };

    const generateSRT = (text: string, durationSeconds: number) => {
        // Dividir texto em sentenças para criar blocos de legenda
        const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
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
    };

    const formatSRTTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
    };

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/transcriptions">Transcriptions</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{transcription.audioFile.originalFilename || "Transcription"}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {transcription.audioFile.originalFilename || "Transcription"}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(transcription.createdAt), "PPP")}</span>
                        </div>
                        {transcription.audioFile.durationSeconds && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{Math.ceil(transcription.audioFile.durationSeconds / 60)} minutes</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            <span>
                                {transcription.costCredits % 1 === 0
                                    ? transcription.costCredits.toFixed(0)
                                    : transcription.costCredits.toFixed(2)}{" "}
                                credits
                            </span>
                        </div>
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleCopy(transcription.text)}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => handleDownload(
                                    transcription.text,
                                    transcription.audioFile.originalFilename || "transcription",
                                    "txt"
                                )}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Download as TXT
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDownload(
                                    transcription.text,
                                    transcription.audioFile.originalFilename || "transcription",
                                    "json"
                                )}
                            >
                                <FileJson className="mr-2 h-4 w-4" />
                                Download as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDownload(
                                    transcription.text,
                                    transcription.audioFile.originalFilename || "transcription",
                                    "srt"
                                )}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Download as SRT (Subtitles)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Share Transcription</DialogTitle>
                                <DialogDescription>
                                    Make this transcription publicly accessible via a shareable link.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="share-toggle">Public sharing</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Anyone with the link can view this transcription
                                        </p>
                                    </div>
                                    <Switch
                                        id="share-toggle"
                                        checked={isPublic}
                                        onCheckedChange={handleToggleShare}
                                        disabled={isLoadingShare}
                                    />
                                </div>

                                {isPublic && shareUrl && (
                                    <div className="space-y-2">
                                        <Label>Share Link</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                                                <Link2 className="h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    value={shareUrl}
                                                    readOnly
                                                    className="flex-1 bg-transparent border-none outline-none text-sm"
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleCopyShareLink}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Copy this link to share with others
                                        </p>
                                    </div>
                                )}

                                {!isPublic && (
                                    <div className="rounded-lg border bg-muted p-4">
                                        <p className="text-sm text-muted-foreground">
                                            This transcription is private. Enable sharing to generate a public link.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Audio Player */}
            <Card>
                <CardHeader>
                    <CardTitle>Audio Player</CardTitle>
                </CardHeader>
                <CardContent>
                    <AudioPlayer audioFileId={transcription.audioFile.id} filename={transcription.audioFile.originalFilename || "audio"} />
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="transcription" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="transcription">Transcription</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="transcription" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Full Transcription</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none whitespace-pre-wrap text-sm">
                                {transcription.text}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                    {transcription.summary ? (
                        <>
                            {transcription.summary.shortSummary && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Short Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{transcription.summary.shortSummary}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {transcription.summary.longSummary && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Long Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{transcription.summary.longSummary}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {transcription.summary.bulletPoints && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Key Points</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc space-y-2 pl-6 text-sm">
                                            {transcription.summary.bulletPoints.split('\n').filter(Boolean).map((point, index) => (
                                                <li key={index}>{point}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                {transcription.summary.keywords && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Keywords</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {transcription.summary.keywords.split(',').map((keyword, index) => (
                                                    <Badge key={index} variant="secondary">
                                                        {keyword.trim()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {transcription.summary.sentiment && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Sentiment</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Badge
                                                variant={
                                                    transcription.summary.sentiment === "positive"
                                                        ? "default"
                                                        : transcription.summary.sentiment === "negative"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                            >
                                                {transcription.summary.sentiment}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">Summary not available yet. This feature will be implemented soon.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

