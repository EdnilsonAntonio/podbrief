"use client";

import { notFound } from "next/navigation";
import { MOCK_TRANSCRIPTIONS } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Copy, Download, Share2, Clock, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { use } from "react";

export default function TranscriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const transcription = MOCK_TRANSCRIPTIONS.find((t) => t.id === id);

    if (!transcription || transcription.status !== "completed") {
        notFound();
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // In a real app, you'd show a toast notification
    };

    const handleDownload = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
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
                        <BreadcrumbPage>{transcription.fileName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{transcription.fileName}</h1>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(transcription.createdAt, "PPP")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{transcription.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            <span>{transcription.creditsUsed} credits</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleCopy(transcription.transcription)}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleDownload(transcription.transcription, `${transcription.fileName}.txt`)}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                    <Button variant="outline">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                </div>
            </div>

            {/* Audio Player */}
            <Card>
                <CardHeader>
                    <CardTitle>Audio Player</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border bg-muted p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Audio player will be integrated here
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {transcription.audioUrl}
                        </p>
                    </div>
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
                                {transcription.transcription}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                    {transcription.summary && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Short Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{transcription.summary.shortSummary}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Long Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{transcription.summary.longSummary}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Key Points</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc space-y-2 pl-6 text-sm">
                                        {transcription.summary.bulletPoints.map((point, index) => (
                                            <li key={index}>{point}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Keywords</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {transcription.summary.keywords.map((keyword, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

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
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

