"use client";

import { CreditCard } from "@/components/dashboard/CreditCard";
import { TranscriptionCard } from "@/components/dashboard/TranscriptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileAudio, TrendingUp, ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

function DashboardContent() {
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    const { data: user, isLoading: isLoadingUser, refetch: refetchUser } = useQuery({
        queryKey: ["user"],
        queryFn: fetchUser,
    });

    useEffect(() => {
        if (paymentStatus === "success") {
            // Verificar se os créditos foram adicionados
            refetchUser();
            
            // Se houver session_id, mostrar mensagem com link para verificação
            if (sessionId) {
                toast.success("Payment successful! If credits were not added, you can verify the payment manually.", {
                    action: {
                        label: "Verify Payment",
                        onClick: () => {
                            window.location.href = `/payments/verify?session_id=${sessionId}`;
                        },
                    },
                    duration: 10000,
                });
            } else {
                toast.success("Payment successful! Credits have been added to your account.");
            }
            
            // Limpar URL após 3 segundos
            setTimeout(() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("payment");
                url.searchParams.delete("session_id");
                window.history.replaceState({}, "", url.toString());
            }, 3000);
        }
    }, [paymentStatus, sessionId, refetchUser]);

    const { data: transcriptions, isLoading: isLoadingTranscriptions, refetch: refetchTranscriptions } = useQuery({
        queryKey: ["transcriptions"],
        queryFn: fetchTranscriptions,
        refetchInterval: (query) => {
            // Se houver transcrições em processamento, atualizar a cada 2 segundos
            const data = query.state.data;
            if (!data || !Array.isArray(data)) {
                return false;
            }
            const hasProcessing = data.some(
                (t: Transcription) => t.audioFile.status === "processing" || t.audioFile.status === "pending"
            );
            return hasProcessing ? 2000 : false;
        },
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0, // Sempre considerar os dados como stale para forçar refetch
    });

    // Monitorar mudanças nas transcrições e forçar refetch quando necessário
    // Usamos audioFile.id como identificador único, pois o id da transcrição muda quando completa
    const previousTranscriptionsRef = useRef<Transcription[] | undefined>(undefined);
    useEffect(() => {
        if (transcriptions && previousTranscriptionsRef.current) {
            // Criar map de status anterior usando audioFile.id como chave
            const previousStatuses = new Map(
                previousTranscriptionsRef.current.map((t) => [t.audioFile.id, t.audioFile.status])
            );
            
            // Verificar se alguma transcrição mudou de status ou se uma nova transcrição apareceu
            const hasStatusChanged = transcriptions.some((t) => {
                const previousStatus = previousStatuses.get(t.audioFile.id);
                // Se não tinha status anterior, é uma nova transcrição
                // Se tinha status anterior e mudou, houve mudança
                return !previousStatus || previousStatus !== t.audioFile.status;
            });

            // Se houve mudança de status ou nova transcrição, forçar refetch
            if (hasStatusChanged) {
                // Forçar refetch imediatamente para pegar a última versão
                refetchTranscriptions();
            }
        }
        previousTranscriptionsRef.current = transcriptions;
    }, [transcriptions, refetchTranscriptions]);

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
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-96 max-w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96 max-w-full" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-lg border p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here's an overview of your account.
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/pricing">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Credits
                    </Link>
                </Button>
            </div>

            {/* Low Credits Alert */}
            {user && user.credits < 10 && (
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                    <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <AlertTitle className="text-orange-900 dark:text-orange-100">
                        Low Credits
                    </AlertTitle>
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                        You have {user.credits % 1 === 0 ? user.credits.toFixed(0) : user.credits.toFixed(2)} credits remaining.{" "}
                        <Link href="/pricing" className="font-semibold underline hover:no-underline">
                            Purchase more credits
                        </Link>{" "}
                        to continue transcribing your audio files.
                    </AlertDescription>
                </Alert>
            )}

            {/* Overview Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <CreditCard credits={user?.credits || 0} plan={undefined} />
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transcriptions</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                            <FileAudio className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTranscriptions}</div>
                        <p className="text-xs text-muted-foreground">Completed successfully</p>
                    </CardContent>
                </Card>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
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
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                            <Upload className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full shadow-sm hover:shadow-md transition-shadow">
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
                <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Recent Transcriptions</h2>
                        <p className="text-muted-foreground">
                            Your latest audio transcriptions and summaries
                        </p>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/dashboard/transcriptions">View All</Link>
                    </Button>
                </div>
                    {recentTranscriptions.length > 0 ? (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="rounded-full bg-primary/10 p-4 mb-4">
                                <FileAudio className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No transcriptions yet</h3>
                            <p className="text-muted-foreground text-center mb-4 max-w-sm">
                                Upload your first audio file to get started with AI-powered transcriptions and summaries.
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/upload">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Audio
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-96 max-w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}

