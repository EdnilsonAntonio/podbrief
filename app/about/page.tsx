import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { FileText, Sparkles, Zap, Users, Target, Heart } from "lucide-react";
import Link from "next/link";

export default async function AboutPage() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">PB</span>
            </div>
            <span className="text-xl font-bold">PodBrief</span>
          </Link>
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
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            About PodBrief
          </h1>
          <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:text-lg">
            We're on a mission to make audio transcription and analysis accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To empower content creators, researchers, and professionals with cutting-edge AI technology 
                that transforms audio content into actionable insights. We believe that every voice deserves 
                to be heard and understood.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We're committed to accuracy, privacy, and user experience. Your content is yours, 
                and we're here to help you unlock its potential while keeping your data secure and private.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Why Choose PodBrief?</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Powerful features designed for modern content creators
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-4" />
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Leveraging OpenAI's Whisper and GPT models for the most accurate transcriptions 
                and intelligent summaries available.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Fast & Efficient</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get your transcriptions and summaries in minutes, not hours. 
                Process multiple files quickly and efficiently.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Multiple Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export your transcriptions in TXT, JSON, or SRT formats. 
                Share publicly or keep them private - you're in control.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Built for Everyone</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Whether you're a podcaster, researcher, or content creator
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Content Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transform your podcast episodes into blog posts, social media content, 
                and SEO-optimized articles with ease.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Researchers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze interviews, focus groups, and research recordings with 
                accurate transcriptions and AI-generated insights.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Professionals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Turn meeting recordings, webinars, and presentations into 
                searchable, shareable documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto py-20">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription>
              Join thousands of users who trust PodBrief for their transcription needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoggedIn ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LoginLink>
                  <Button size="lg">Get Started Free</Button>
                </LoginLink>
                <Button asChild variant="outline" size="lg">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PodBrief. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

