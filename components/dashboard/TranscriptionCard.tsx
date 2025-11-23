"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { FileAudio, Clock, CreditCard, Eye, Download, CheckCircle2, XCircle, Loader2, FileText, FileJson } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadTranscription } from "@/lib/download-utils";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

interface TranscriptionCardData {
    id: string;
    fileName: string;
    duration: number;
    creditsUsed: number;
    status: "completed" | "processing" | "error" | "pending";
    createdAt: Date;
    audioUrl?: string;
    transcription?: string;
    summary?: any;
}

interface TranscriptionCardProps {
    transcription: TranscriptionCardData;
}

export function TranscriptionCard({ transcription }: TranscriptionCardProps) {
    const locale = useLocale();
    const t = useTranslations();
    
    const getStatusBadge = () => {
        switch (transcription.status) {
            case "completed":
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {t("transcriptions.completed")}
                    </Badge>
                );
            case "processing":
                return (
                    <Badge variant="secondary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        {t("transcriptions.processing")}
                    </Badge>
                );
            case "pending":
                return (
                    <Badge variant="secondary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        {t("transcriptions.pending")}
                    </Badge>
                );
            case "error":
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        {t("transcriptions.error")}
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/20">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                            <FileAudio className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2 break-words">{transcription.fileName}</CardTitle>
                            <CardDescription className="mt-1">
                                {formatDistanceToNow(transcription.createdAt, { addSuffix: true })}
                            </CardDescription>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{transcription.duration} {t("transcription.minutes")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        <span>
                            {transcription.creditsUsed % 1 === 0
                                ? transcription.creditsUsed.toFixed(0)
                                : transcription.creditsUsed.toFixed(2)}{" "}
                            {t("transcription.credits")}
                        </span>
                    </div>
                </div>
            </CardContent>
            {transcription.status === "completed" && (
                <CardFooter className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 hover:bg-accent/50 transition-colors">
                        <Link href={`/${locale}/transcription/${transcription.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("common.view")}
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 hover:bg-accent/50 transition-colors">
                                <Download className="mr-2 h-4 w-4" />
                                {t("transcription.download")}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={async () => {
                                    try {
                                        await downloadTranscription(transcription.id, "txt");
                                        toast.success(t("transcription.downloadStarted"));
                                    } catch (error) {
                                        toast.error(t("transcription.downloadError"));
                                    }
                                }}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                TXT
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async () => {
                                    try {
                                        await downloadTranscription(transcription.id, "json");
                                        toast.success(t("transcription.downloadStarted"));
                                    } catch (error) {
                                        toast.error(t("transcription.downloadError"));
                                    }
                                }}
                            >
                                <FileJson className="mr-2 h-4 w-4" />
                                JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async () => {
                                    try {
                                        await downloadTranscription(transcription.id, "srt");
                                        toast.success(t("transcription.downloadStarted"));
                                    } catch (error) {
                                        toast.error(t("transcription.downloadError"));
                                    }
                                }}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                SRT
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            )}
        </Card>
    );
}

