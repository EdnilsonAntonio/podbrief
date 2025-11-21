import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ContactForm } from "./contact-form";
import { getTranslations } from "next-intl/server";
import { LanguageSelector } from "@/components/LanguageSelector";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();

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
              <Button asChild>
                <Link href={`/${locale}/dashboard`}>{t("common.goToDashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href={`/${locale}/pricing`}>{t("common.pricing")}</Link>
                </Button>
                <LoginLink>
                  <Button>{t("common.signIn")}</Button>
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
            {t("contact.title")}
          </h1>
          <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:text-lg">
            {t("contact.description")}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contact.sendMessage")}</CardTitle>
              <CardDescription>
                {t("contact.formDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("contact.contactInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t("contact.email")}</h3>
                    <p className="text-sm text-muted-foreground">
                      <a href="mailto:support@podbrief.online" className="hover:underline">
                        support@podbrief.online
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t("contact.responseTime")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("contact.responseTimeValue")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">How accurate are the transcriptions?</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI-powered transcription uses OpenAI's Whisper model, which provides 
                    industry-leading accuracy, typically above 95% for clear audio.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">What audio formats do you support?</h3>
                  <p className="text-sm text-muted-foreground">
                    We support all common audio formats including MP3, WAV, M4A, OGG, FLAC, and WebM.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Can I cancel my purchase?</h3>
                  <p className="text-sm text-muted-foreground">
                    Credits are non-refundable, but they never expire. You can use them anytime.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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
                <li><Link href={`/${locale}/pricing`} className="hover:text-foreground">{t("common.pricing")}</Link></li>
                <li><Link href={`/${locale}/dashboard`} className="hover:text-foreground">{t("common.dashboard")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t("common.about")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href={`/${locale}/about`} className="hover:text-foreground">{t("common.about")}</Link></li>
                <li><Link href={`/${locale}/contact`} className="hover:text-foreground">{t("common.contact")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t("common.terms")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href={`/${locale}/privacy`} className="hover:text-foreground">{t("common.privacy")}</Link></li>
                <li><Link href={`/${locale}/terms`} className="hover:text-foreground">{t("common.terms")}</Link></li>
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

