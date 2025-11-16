"use client";

import { TranscriptionCard } from "@/components/dashboard/TranscriptionCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
    _isProcessing?: boolean; // Flag para identificar itens em processamento
}

async function fetchTranscriptions(): Promise<Transcription[]> {
    const response = await fetch("/api/transcriptions");
    if (!response.ok) {
        throw new Error("Failed to fetch transcriptions");
    }
    return response.json();
}

export default function TranscriptionsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const { data: transcriptions, isLoading, refetch } = useQuery({
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
                refetch();
            }
        }
        previousTranscriptionsRef.current = transcriptions;
    }, [transcriptions, refetch]);

    // Filtrar transcrições baseado na busca e status
    const filteredTranscriptions = useMemo(() => {
        if (!transcriptions) return [];

        let filtered = transcriptions;

        // Filtrar por status
        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (t: Transcription) => t.audioFile.status === statusFilter
            );
        }

        // Filtrar por termo de busca (nome do arquivo)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((t: Transcription) => {
                const fileName = (t.audioFile.originalFilename || "Unknown").toLowerCase();
                return fileName.includes(query);
            });
        }

        return filtered;
    }, [transcriptions, searchQuery, statusFilter]);

    const statusCounts = useMemo(() => {
        if (!transcriptions) return { all: 0, completed: 0, processing: 0, pending: 0, error: 0 };

        return {
            all: transcriptions.length,
            completed: transcriptions.filter((t: Transcription) => t.audioFile.status === "completed").length,
            processing: transcriptions.filter((t: Transcription) => t.audioFile.status === "processing").length,
            pending: transcriptions.filter((t: Transcription) => t.audioFile.status === "pending").length,
            error: transcriptions.filter((t: Transcription) => t.audioFile.status === "error").length,
        };
    }, [transcriptions]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">All Transcriptions</h1>
                <p className="text-muted-foreground">
                    View and manage all your audio transcriptions
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by filename..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <span className="flex items-center gap-2">
                                    All Status
                                    <Badge variant="secondary" className="ml-auto">
                                        {statusCounts.all}
                                    </Badge>
                                </span>
                            </SelectItem>
                            <SelectItem value="completed">
                                <span className="flex items-center gap-2">
                                    Completed
                                    <Badge variant="secondary" className="ml-auto">
                                        {statusCounts.completed}
                                    </Badge>
                                </span>
                            </SelectItem>
                            <SelectItem value="processing">
                                <span className="flex items-center gap-2">
                                    Processing
                                    <Badge variant="secondary" className="ml-auto">
                                        {statusCounts.processing}
                                    </Badge>
                                </span>
                            </SelectItem>
                            <SelectItem value="pending">
                                <span className="flex items-center gap-2">
                                    Pending
                                    <Badge variant="secondary" className="ml-auto">
                                        {statusCounts.pending}
                                    </Badge>
                                </span>
                            </SelectItem>
                            <SelectItem value="error">
                                <span className="flex items-center gap-2">
                                    Error
                                    <Badge variant="secondary" className="ml-auto">
                                        {statusCounts.error}
                                    </Badge>
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Mostrar contadores de resultados */}
            {(searchQuery || statusFilter !== "all") && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                        Showing {filteredTranscriptions.length} of {transcriptions?.length || 0} transcriptions
                    </span>
                    {(searchQuery || statusFilter !== "all") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                            }}
                            className="h-auto p-0 text-xs"
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4 p-6 border rounded-lg">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredTranscriptions && filteredTranscriptions.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTranscriptions.map((transcription: Transcription) => {
                        // Para transcrições completas, usar o ID da Transcription
                        // Para itens em processamento, o ID é do AudioFile (será resolvido pela API)
                        const transcriptionId = transcription._isProcessing
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
            ) : transcriptions && transcriptions.length > 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        No transcriptions match your filters. Try adjusting your search or filters.
                    </p>
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No transcriptions yet. Upload an audio file to get started!</p>
                </div>
            )}
        </div>
    );
}

