"use client";

import { CreditCard } from "@/components/dashboard/CreditCard";
import { TranscriptionCard } from "@/components/dashboard/TranscriptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileAudio, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    credits: number;
}

interface Transcription {
    id: string;
    audioFile: {
        id: string;
        originalFilename: string | null;
        durationSeconds: number | null;
        status: string;
        createdAt: Date;
    };
    costCredits: number;
    createdAt: Date;
}

async function fetchUser(): Promise<User> {
    const response = await fetch("/api/user");
    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }
    return response.json();
}

async function fetchTranscriptions(): Promise<Transcription[]> {
    const response = await fetch("/api/transcriptions");
    if (!response.ok) {
        throw new Error("Failed to fetch transcriptions");
    }
    return response.json();
}

export default function DashboardPage() {
    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ["user"],
        queryFn: fetchUser,
    });

    const { data: transcriptions, isLoading: isLoadingTranscriptions } = useQuery({
        queryKey: ["transcriptions"],
        queryFn: fetchTranscriptions,
        refetchInterval: (data) => {
            // Se houver transcrições em processamento, atualizar a cada 3 segundos
            if (!data || !Array.isArray(data)) {
                return false;
            }
            const hasProcessing = data.some(
                (t: Transcription) => t.audioFile.status === "processing" || t.audioFile.status === "pending"
            );
            return hasProcessing ? 3000 : false;
        },
    });

    const recentTranscriptions = transcriptions?.slice(0, 3) || [];
    const totalTranscriptions = transcriptions?.filter(
        (t: Transcription) => t.audioFile.status === "completed"
    ).length || 0;
    const totalCreditsUsed = transcriptions?.reduce(
        (sum: number, t: Transcription) => sum + (t.costCredits || 0),
        0
    ) || 0;

    if (isLoadingUser || isLoadingTranscriptions) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-48" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here's an overview of your account.
                </p>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CreditCard credits={user?.credits || 0} plan={undefined} />
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transcriptions</CardTitle>
                        <FileAudio className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTranscriptions}</div>
                        <p className="text-xs text-muted-foreground">Completed successfully</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalCreditsUsed % 1 === 0
                                ? totalCreditsUsed.toFixed(0)
                                : totalCreditsUsed.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/dashboard/upload">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Audio
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transcriptions */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Recent Transcriptions</h2>
                        <p className="text-muted-foreground">
                            Your latest audio transcriptions and summaries
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/transcriptions">View All</Link>
                    </Button>
                </div>
                    {recentTranscriptions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {recentTranscriptions.map((transcription: Transcription) => {
                                // Para transcrições completas, usar o ID da Transcription
                                // Para itens em processamento, o ID é do AudioFile (será resolvido pela API)
                                const transcriptionId = (transcription as any)._isProcessing 
                                    ? transcription.audioFile.id 
                                    : transcription.id;
                                
                                return (
                                    <TranscriptionCard
                                        key={transcription.id}
                                        transcription={{
                                            id: transcriptionId,
                                            fileName: transcription.audioFile.originalFilename || "Unknown",
                                            duration: transcription.audioFile.durationSeconds
                                                ? Math.ceil(transcription.audioFile.durationSeconds / 60)
                                                : 0,
                                            creditsUsed: transcription.costCredits,
                                            status: (transcription.audioFile.status || "pending") as "completed" | "processing" | "error" | "pending",
                                            createdAt: new Date(transcription.audioFile.createdAt),
                                            audioUrl: "",
                                            transcription: "",
                                            summary: null,
                                        }}
                                    />
                                );
                            })}
                        </div>
                ) : (
                    <div className="text-center py-12 border rounded-lg">
                        <p className="text-muted-foreground">No transcriptions yet. Upload an audio file to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

