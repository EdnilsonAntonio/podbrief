"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, X } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

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

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // Tratar rate limit especificamente
                if (response.status === 429) {
                    const resetTime = data.reset ? new Date(data.reset).toLocaleTimeString() : "later";
                    throw new Error(data.message || `Upload limit exceeded. Please try again after ${resetTime}`);
                }
                throw new Error(data.error || data.message || "Upload failed");
            }

            toast.success("File uploaded successfully! Processing transcription...");

            // Redirecionar para a página de transcrições após um breve delay
            setTimeout(() => {
                router.push("/dashboard/transcriptions");
            }, 1500);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to upload file"
            );
            setIsUploading(false);
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
                <h1 className="text-3xl font-bold tracking-tight">Upload Audio</h1>
                <p className="text-muted-foreground">
                    Upload your podcast audio file to generate transcription and summary
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Audio File</CardTitle>
                    <CardDescription>
                        Supported formats: MP3, WAV, M4A, OGG, FLAC (Max 500MB)
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
                                        ? "Drop the file here"
                                        : "Drag & drop your audio file here"}
                                </p>
                                <p className="text-xs text-muted-foreground mb-4">or</p>
                                <Button variant="outline" asChild>
                                    <label htmlFor="audio-upload" className="cursor-pointer">
                                        Browse Files
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
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full"
                            >
                                {isUploading ? "Uploading..." : "Start Transcription"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>How it works</CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-4">
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                1
                            </span>
                            <div>
                                <p className="font-medium">Upload your audio file</p>
                                <p className="text-sm text-muted-foreground">
                                    Select or drag and drop your podcast audio file
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                2
                            </span>
                            <div>
                                <p className="font-medium">AI Transcription</p>
                                <p className="text-sm text-muted-foreground">
                                    Our AI processes your audio using Whisper API
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                3
                            </span>
                            <div>
                                <p className="font-medium">Get Summary</p>
                                <p className="text-sm text-muted-foreground">
                                    Receive detailed transcription and AI-generated summary
                                </p>
                            </div>
                        </li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}

