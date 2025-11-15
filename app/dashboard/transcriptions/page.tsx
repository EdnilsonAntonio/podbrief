import { TranscriptionCard } from "@/components/dashboard/TranscriptionCard";
import { MOCK_TRANSCRIPTIONS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function TranscriptionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">All Transcriptions</h1>
                <p className="text-muted-foreground">
                    View and manage all your audio transcriptions
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search transcriptions..."
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {MOCK_TRANSCRIPTIONS.map((transcription) => (
                    <TranscriptionCard key={transcription.id} transcription={transcription} />
                ))}
            </div>
        </div>
    );
}

