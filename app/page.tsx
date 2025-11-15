import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_PLANS } from "@/lib/mock-data";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Check, Upload, FileText, Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default async function LandingPage() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">PB</span>
            </div>
            <span className="text-xl font-bold">PodBrief</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/pricing">Pricing</Link>
                </Button>
                <LoginLink>
                  <Button>Sign In</Button>
                </LoginLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto space-y-6 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <Badge variant="secondary" className="mx-auto">
            AI-Powered Transcription & Summarization
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Transform Your Podcasts into
            <span className="text-primary"> Actionable Insights</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Upload your audio files and get instant transcriptions and AI-generated summaries.
            Perfect for content creators, researchers, and podcasters.
          </p>
          <div className="flex items-center justify-center gap-4">
            {isLoggedIn ? (
              <Button asChild size="lg">
                <Link href="/dashboard/upload">
                  Upload Audio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <LoginLink>
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </LoginLink>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="mt-2 text-muted-foreground">
            Three simple steps to get your transcriptions and summaries
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>1. Upload Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Simply drag and drop or select your podcast audio file. We support MP3, WAV, M4A, and more.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>2. AI Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our advanced AI uses Whisper API to accurately transcribe your audio in minutes.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>3. Get Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Receive detailed transcriptions and intelligent summaries with key points and insights.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
          <p className="mt-2 text-muted-foreground">
            Choose the plan that fits your needs. All plans include full access to all features.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 max-w-7xl mx-auto">
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
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-lg font-bold">PB</span>
                </div>
                <span className="text-xl font-bold">PodBrief</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered transcription and summarization for your podcasts.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} PodBrief. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
