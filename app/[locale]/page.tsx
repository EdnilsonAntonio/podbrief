import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_PLANS } from "@/lib/mock-data";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Check, Upload, FileText, Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSelector } from "@/components/LanguageSelector";

export default async function LandingPage({
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
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">PB</span>
            </div>
            <span className="text-xl font-bold">{t("common.appName")}</span>
          </div>
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
      <section className="relative container mx-auto space-y-6 py-20 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl -z-10" />
        
        <div className="mx-auto max-w-3xl space-y-6 relative">
          <Badge variant="secondary" className="mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
            {t("landing.badge")}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {t("landing.title")}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("landing.titleHighlight")}
            </span>
          </h1>
          <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {t("landing.description")}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 px-4 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {isLoggedIn ? (
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                <Link href={`/${locale}/dashboard/upload`}>
                  {t("common.uploadAudio")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <LoginLink>
                  <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                    {t("common.getStarted")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </LoginLink>
                <Button asChild size="lg" variant="outline" className="hover:bg-accent/50 transition-colors">
                  <Link href={`/${locale}/pricing`}>{t("common.viewPricing")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("landing.howItWorks")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("landing.howItWorksDescription")}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/20">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("landing.step1Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("landing.step1Description")}
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/20">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("landing.step2Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("landing.step2Description")}
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/20">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("landing.step3Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("landing.step3Description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto space-y-12 py-20 bg-muted/50">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("landing.statsTitle")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("landing.statsDescription")}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
            <p className="text-muted-foreground">{t("landing.statsHours")}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">5K+</div>
            <p className="text-muted-foreground">{t("landing.statsUsers")}</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <p className="text-muted-foreground">{t("landing.statsUptime")}</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("landing.pricingTitle")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("landing.pricingDescription")}
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
                {isLoggedIn ? (
                  <Button asChild className={`w-full ${plan.popular ? "shadow-md hover:shadow-lg" : ""}`} variant={plan.popular ? "default" : "outline"} 
                    size="lg">
                    <Link href={`/${locale}/pricing`}>{t("pricing.purchaseCredits")}</Link>
                  </Button>
                ) : (
                  <LoginLink>
                    <Button className={`w-full ${plan.popular ? "shadow-md hover:shadow-lg" : ""}`} variant={plan.popular ? "default" : "outline"} 
                      size="lg">
                      {t("common.getStarted")}
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
          <h2 className="text-3xl font-bold tracking-tight">{t("landing.faqTitle")}</h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("landing.faq1Question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("landing.faq1Answer")}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>{t("landing.faq2Question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("landing.faq2Answer")}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>{t("landing.faq3Question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("landing.faq3Answer")}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>{t("landing.faq4Question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("landing.faq4Answer")}
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
                <span className="text-xl font-bold">{t("common.appName")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("about.footerDescription")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t("common.pricing")}</h3>
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
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>{t("landing.copyright", { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

