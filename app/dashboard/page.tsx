import { CreditCard } from "@/components/dashboard/CreditCard";
import { TranscriptionCard } from "@/components/dashboard/TranscriptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_USER, MOCK_TRANSCRIPTIONS } from "@/lib/mock-data";
import { Upload, FileAudio, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const recentTranscriptions = MOCK_TRANSCRIPTIONS.slice(0, 3);
    const totalTranscriptions = MOCK_TRANSCRIPTIONS.filter((t) => t.status === "completed").length;
    const totalCreditsUsed = MOCK_TRANSCRIPTIONS.reduce((sum, t) => sum + t.creditsUsed, 0);

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
                <CreditCard credits={MOCK_USER.credits} plan={MOCK_USER.currentPlan} />
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
                        <div className="text-2xl font-bold">{totalCreditsUsed}</div>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recentTranscriptions.map((transcription) => (
                        <TranscriptionCard key={transcription.id} transcription={transcription} />
                    ))}
                </div>
            </div>
        </div>
    );
}

