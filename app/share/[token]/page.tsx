"use client";

import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SharedTranscriptionData {
    id: string;
    text: string;
    createdAt: Date;
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
    sharedBy: {
        name: string | null;
        imageUrl: string | null;
    };
}

async function fetchSharedTranscription(token: string): Promise<SharedTranscriptionData> {
    const response = await fetch(`/api/share/${token}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Shared transcription not found");
        }
        throw new Error("Failed to fetch shared transcription");
    }
    return response.json();
}

export default function SharedTranscriptionPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const { data: transcription, isLoading, error } = useQuery({
        queryKey: ["shared-transcription", token],
        queryFn: () => fetchSharedTranscription(token),
    });

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl py-8 space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !transcription) {
        notFound();
    }

    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {transcription.audioFile.originalFilename || "Shared Transcription"}
                        </h1>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                        </div>
                    </div>
                    <Badge variant="secondary">Shared</Badge>
                </div>

                {/* Shared by */}
                {transcription.sharedBy.name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Shared by {transcription.sharedBy.name}</span>
                    </div>
                )}

                <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        This transcription was shared publicly.{" "}
                        <Link href="/" className="text-primary hover:underline">
                            Create your own transcription
                        </Link>
                    </p>
                </div>
            </div>

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
                                <p className="text-muted-foreground">Summary not available for this transcription.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

