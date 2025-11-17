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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
      <section className="relative container mx-auto space-y-6 py-20 text-center overflow-hidden">
        {/* Background gradient - mais suave e sem bordas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl -z-10" />
        
        <div className="mx-auto max-w-3xl space-y-6 relative">
          <Badge variant="secondary" className="mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
            AI-Powered Transcription & Summarization
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            Transform Your Podcasts into
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Actionable Insights</span>
          </h1>
          <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Upload your audio files and get instant transcriptions and AI-generated summaries.
            Perfect for content creators, researchers, and podcasters.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 px-4 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {isLoggedIn ? (
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/dashboard/upload">
                  Upload Audio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <LoginLink>
                  <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </LoginLink>
                <Button asChild size="lg" variant="outline" className="hover:bg-accent/50 transition-colors">
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
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/20">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/20">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/20">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
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

      {/* Stats Section */}
      <section className="container mx-auto space-y-12 py-20 bg-muted/50">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Trusted by Content Creators</h2>
          <p className="mt-2 text-muted-foreground">
            Join thousands of users who trust PodBrief for their transcription needs
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
            <p className="text-muted-foreground">Hours Transcribed</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">5K+</div>
            <p className="text-muted-foreground">Active Users</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <p className="text-muted-foreground">Uptime</p>
          </div>
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
                  Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <p className="text-xs text-muted-foreground mt-1">Final price at checkout</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{plan.credits} Credits</span>
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
                  <Button asChild className={`w-full ${plan.popular ? "shadow-md hover:shadow-lg" : ""}`} variant={plan.popular ? "default" : "outline"} 
                    size="lg">
                    <Link href="/pricing">Purchase Credits</Link>
                  </Button>
                ) : (
                  <LoginLink>
                    <Button className={`w-full ${plan.popular ? "shadow-md hover:shadow-lg" : ""}`} variant={plan.popular ? "default" : "outline"} 
                      size="lg">
                      Get Started
                    </Button>
                  </LoginLink>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to know about PodBrief
          </p>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What audio formats do you support?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We support all major audio formats including MP3, WAV, M4A, OGG, and FLAC. The maximum file size is 500MB.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>How accurate are the transcriptions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our transcriptions use OpenAI's Whisper API, which provides industry-leading accuracy. The quality depends on audio clarity, background noise, and speaker accents, but typically achieves 95%+ accuracy for clear audio.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>How long does transcription take?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Transcription time varies based on file length. Typically, a 1-hour audio file takes 2-5 minutes to process. You'll receive a notification when your transcription is ready.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>What happens to my audio files?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your audio files are securely stored and processed. We automatically delete files older than 7 days to protect your privacy. You can delete your files and transcriptions at any time from your dashboard.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Can I export my transcriptions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can export your transcriptions in multiple formats including TXT, JSON, and SRT (for subtitles). All export options are available from the transcription detail page.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>How do credits work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Credits are used to transcribe audio files. 1 credit = 1 minute of audio transcription. Credits don't expire, so you can use them whenever you need. Purchase more credits anytime from the pricing page.
              </p>
            </CardContent>
          </Card>
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
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
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
