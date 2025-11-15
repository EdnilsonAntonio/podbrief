"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { checkAuthStatus } from "./actions";
import { Card, CardContent } from "@/components/ui/card";

export default function CallbackPage() {
    const router = useRouter();
    const { user } = useKindeBrowserClient();
    const { data, isLoading } = useQuery({
        queryKey: ["checkAuthStatus"],
        queryFn: async () => await checkAuthStatus(),
    });

    if (data?.success) {
        router.push("/dashboard");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="text-xl font-bold">PB</span>
                    </div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Completing sign in...</h3>
                        <p className="text-sm text-muted-foreground">
                            Please wait while we set up your account
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}