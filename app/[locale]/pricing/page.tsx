"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_PLANS } from "@/lib/mock-data";
import { LoginLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Check, Zap, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function PricingPage() {
    const t = useTranslations();
    const locale = useLocale();
    const { isAuthenticated } = useKindeBrowserClient();
    const isLoggedIn = isAuthenticated;
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

    const handlePurchase = async (planId: string) => {
        if (!isLoggedIn) {
            toast.error(t("pricing.signInRequired") || "Please sign in to purchase credits");
            const loginUrl = `/api/auth/login?post_login_redirect_url=${encodeURIComponent(`/${locale}/pricing`)}`;
            window.location.href = loginUrl;
            return;
        }

        setLoadingPlanId(planId);
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ planId, locale }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create checkout session");
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to start checkout"
            );
            setLoadingPlanId(null);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <Link href={`/${locale}`} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-lg font-bold">PB</span>
                        </div>
                        <span className="text-xl font-bold">{t("common.appName")}</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSelector />
                        {isLoggedIn ? (
                            <Button asChild variant="ghost">
                                <Link href={`/${locale}/dashboard`}>{t("common.dashboard")}</Link>
                            </Button>
                        ) : (
                            <LoginLink>
                                <Button>{t("common.signIn")}</Button>
                            </LoginLink>
                        )}
                    </div>
                </div>
            </header>

            <div className="container mx-auto space-y-12 py-20">
                <div className="text-center">
                    <Button asChild variant="ghost" className="mb-6">
                        <Link href={`/${locale}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t("common.back")}
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-bold tracking-tight">{t("pricing.title")}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        {t("pricing.description")}
                    </p>
                </div>

                <div className="grid gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
                    {PRICING_PLANS.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col ${
                                plan.popular 
                                    ? "border-primary shadow-lg border-2 relative overflow-hidden" 
                                    : "hover:border-primary/30"
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg z-10">
                                    {t("pricing.popular")}
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">${plan.price}</span>
                                    <p className="text-xs text-muted-foreground mt-1">{t("pricing.oneTime")}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1 flex flex-col">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">{plan.credits} {t("common.credits")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{plan.minutes} {t("landing.minutes")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{t("pricing.fullTranscription")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{t("pricing.aiSummary")}</span>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handlePurchase(plan.id)}
                                    disabled={loadingPlanId === plan.id}
                                    className={`w-full ${plan.popular ? "shadow-md hover:shadow-lg" : ""}`} 
                                    variant={plan.popular ? "default" : "outline"} 
                                    size="lg"
                                >
                                    {loadingPlanId === plan.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t("common.loading")}
                                        </>
                                    ) : isLoggedIn ? (
                                        t("pricing.purchaseCredits")
                                    ) : (
                                        t("common.getStarted")
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

