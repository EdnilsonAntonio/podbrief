import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_PLANS } from "@/lib/mock-data";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Check, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PricingPage() {
    const { isAuthenticated } = getKindeServerSession();
    const isLoggedIn = await isAuthenticated();

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-lg font-bold">PB</span>
                        </div>
                        <span className="text-xl font-bold">PodBrief</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Button asChild variant="ghost">
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                        ) : (
                            <LoginLink>
                                <Button>Sign In</Button>
                            </LoginLink>
                        )}
                    </div>
                </div>
            </header>

            <div className="container space-y-12 py-20">
                <div className="text-center">
                    <Button asChild variant="ghost" className="mb-6">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Choose the plan that fits your needs. All plans include full access to all features.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {PRICING_PLANS.map((plan) => (
                        <Card
                            key={plan.id}
                            className={plan.popular ? "border-primary shadow-lg" : ""}
                        >
                            <CardHeader>
                                {plan.popular && (
                                    <Badge className="mb-2 w-fit">Popular</Badge>
                                )}
                                <CardTitle>{plan.name}</CardTitle>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">${plan.price}</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{plan.credits} Credits</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{plan.minutes} Minutes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">Full Transcription</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">AI Summary</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">Export Options</span>
                                    </div>
                                </div>
                                {isLoggedIn ? (
                                    <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                                        <Link href="/settings">Change Plan</Link>
                                    </Button>
                                ) : (
                                    <LoginLink>
                                        <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                                            Get Started
                                        </Button>
                                    </LoginLink>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="rounded-lg border bg-muted p-8 text-center">
                    <h3 className="text-xl font-semibold mb-2">Need more?</h3>
                    <p className="text-muted-foreground mb-4">
                        Contact us for custom enterprise plans with unlimited credits and dedicated support.
                    </p>
                    <Button variant="outline">Contact Sales</Button>
                </div>
            </div>
        </div>
    );
}

