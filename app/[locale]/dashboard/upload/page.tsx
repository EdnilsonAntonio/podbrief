"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileAudio, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UploadPage() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const fileSizeMB = file.size / (1024 * 1024);
            const useChunkUpload = file.size > 4 * 1024 * 1024; // > 4MB

            if (useChunkUpload) {
                // Upload em chunks para arquivos grandes
                console.log(`📦 Large file detected: ${fileSizeMB.toFixed(2)}MB - Using chunked upload`);
                
                const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB por chunk
                const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                const uploadId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

                console.log(`📊 File will be split into ${totalChunks} chunks`);

                try {
                    // Enviar chunks sequencialmente
                    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                        const start = chunkIndex * CHUNK_SIZE;
                        const end = Math.min(start + CHUNK_SIZE, file.size);
                        const chunk = file.slice(start, end);

                        const chunkFormData = new FormData();
                        chunkFormData.append("chunk", chunk);
                        chunkFormData.append("uploadId", uploadId);
                        chunkFormData.append("chunkIndex", chunkIndex.toString());
                        chunkFormData.append("totalChunks", totalChunks.toString());
                        chunkFormData.append("filename", file.name);
                        chunkFormData.append("contentType", file.type);
                        chunkFormData.append("totalSize", file.size.toString());

                        // Atualizar progresso (reservar 10% para recombinação)
                        const uploadProgress = Math.floor(((chunkIndex + 1) / totalChunks) * 90);
                        setUploadProgress(uploadProgress);

                        console.log(`⬆️ Uploading chunk ${chunkIndex + 1}/${totalChunks}...`);

                        const chunkResponse = await fetch("/api/upload/chunk", {
                            method: "POST",
                            body: chunkFormData,
                        });

                        if (!chunkResponse.ok) {
                            const chunkData = await chunkResponse.json().catch(() => ({}));
                            throw new Error(chunkData.error || chunkData.message || `Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
                        }

                        const chunkData = await chunkResponse.json();
                        console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded:`, chunkData.message);
                    }

                    // Todos os chunks foram enviados, agora recombinar
                    console.log(`🔄 All chunks uploaded, recombining file...`);
                    setUploadProgress(95);

                    const completeResponse = await fetch("/api/upload/complete", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            uploadId,
                            filename: file.name,
                            contentType: file.type,
                            totalSize: file.size,
                            totalChunks,
                        }),
                    });

                    if (!completeResponse.ok) {
                        const completeData = await completeResponse.json().catch(() => ({}));
                        throw new Error(completeData.error || completeData.message || "Failed to complete upload");
                    }

                    const completeData = await completeResponse.json();
                    setUploadProgress(100);

                    toast.success(`File (${fileSizeMB.toFixed(2)}MB) uploaded successfully! Processing transcription...`);
                    setTimeout(() => {
                        router.push(`/${locale}/dashboard/transcriptions`);
                    }, 1500);
                    return;
                } catch (chunkError: any) {
                    // Em caso de erro, tentar limpar chunks no servidor
                    console.error("Chunk upload error:", chunkError);
                    // Não bloquear se a limpeza falhar
                    fetch("/api/upload/cleanup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uploadId }),
                    }).catch(() => {});
                    
                    throw chunkError;
                }
            }

            // Upload direto para arquivos pequenos (< 4MB)
            const formData = new FormData();
            formData.append("file", file);

            // Simular progresso durante upload
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Verificar se a resposta é JSON antes de fazer parse
            let data: any = null;
            const contentType = response.headers.get("content-type");
            
            // Tratar erro 413 (Payload Too Large)
            if (response.status === 413) {
              const errorMsg = data?.message || "File size exceeds the maximum allowed size. Please compress your audio file or split it into smaller parts.";
              setError(errorMsg);
              throw new Error(errorMsg);
            }
            
            if (contentType && contentType.includes("application/json")) {
              try {
                data = await response.json();
              } catch (e) {
                // Se falhar ao fazer parse, ler como texto
                const text = await response.text();
                console.error("Failed to parse JSON response:", text);
                throw new Error(`Server error: ${text.substring(0, 100)}`);
              }
            } else {
              // Se não for JSON, ler como texto para ver o erro
              const text = await response.text();
              console.error("Non-JSON response:", text);
              throw new Error(`Server error: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                // Tratar diferentes tipos de erro com mensagens específicas
                if (response.status === 429) {
                    const resetTime = data?.reset ? new Date(data.reset).toLocaleTimeString() : "later";
                    const errorMsg = `Upload limit exceeded. You can upload up to 10 files per hour. Please try again after ${resetTime}.`;
                    setError(errorMsg);
                    throw new Error(errorMsg);
                } else if (response.status === 400) {
                    if (data?.error === "Insufficient credits") {
                        // Usar mensagem detalhada do servidor se disponível
                        const errorMsg = data.message || "You don't have enough credits to transcribe this file. Please purchase more credits.";
                        setError(errorMsg);
                        throw new Error(errorMsg);
                    } else if (data?.error?.includes("File too large")) {
                        const errorMsg = data.message || "File size exceeds the 4MB limit. Please compress your audio file or split it into smaller parts.";
                        setError(errorMsg);
                        throw new Error(errorMsg);
                    } else if (data?.error?.includes("Invalid file type")) {
                        const errorMsg = "Invalid file type. Please upload an audio file (MP3, WAV, M4A, OGG, or FLAC).";
                        setError(errorMsg);
                        throw new Error(errorMsg);
                    }
                } else if (response.status === 401) {
                    const errorMsg = "You need to be logged in to upload files. Please sign in and try again.";
                    setError(errorMsg);
                    throw new Error(errorMsg);
                }
                throw new Error(data?.error || data?.message || "Upload failed. Please try again.");
            }

            toast.success("File uploaded successfully! Processing transcription...");

            // Redirecionar para a página de transcrições após um breve delay
            setTimeout(() => {
                router.push(`/${locale}/dashboard/transcriptions`);
            }, 1500);
        } catch (error) {
            console.error("Upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
            toast.error(errorMessage);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("upload.title")}</h1>
                <p className="text-muted-foreground">
                    {t("upload.description")}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("upload.selectFile")}</CardTitle>
                    <CardDescription>
                        {t("upload.supportedFormats")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!file ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition-colors ${isDragOver
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
                                }`}
                        >
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="audio-upload"
                            />
                            <div>
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium mb-2">
                                    {isDragOver
                                        ? t("upload.dropHere")
                                        : t("upload.dragDrop")}
                                </p>
                                <p className="text-xs text-muted-foreground mb-4">{t("upload.or")}</p>
                                <Button variant="outline" asChild>
                                    <label htmlFor="audio-upload" className="cursor-pointer" aria-label="Browse files to upload">
                                        {t("upload.browseFiles")}
                                    </label>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <FileAudio className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={removeFile}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            {error && (
                                <Alert className="border-destructive bg-destructive/10">
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                    <AlertTitle className="text-destructive">Upload Error</AlertTitle>
                                    <AlertDescription className="text-destructive/90">{error}</AlertDescription>
                                </Alert>
                            )}
                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{t("upload.uploading")}</span>
                                        <span className="text-muted-foreground">{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full"
                            >
                                {isUploading ? t("upload.uploading") : t("upload.startTranscription")}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">
                    {t("upload.retentionTitle")}
                </AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                    {t("upload.retentionDescription")}
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>{t("upload.howItWorks")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-4">
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                1
                            </span>
                            <div>
                                <p className="font-medium">{t("upload.step1Title")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t("upload.step1Description")}
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                2
                            </span>
                            <div>
                                <p className="font-medium">{t("upload.step2Title")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t("upload.step2Description")}
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                3
                            </span>
                            <div>
                                <p className="font-medium">{t("upload.step3Title")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t("upload.step3Description")}
                                </p>
                            </div>
                        </li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}

