import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { FileText, Sparkles, Zap, Users, Target, Heart } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSelector } from "@/components/LanguageSelector";

export default async function AboutPage({
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
            {t("about.title")}
          </h1>
          <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:text-lg">
            {t("about.description")}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-primary mb-4" />
              <CardTitle>{t("about.missionTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("about.missionDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-8 w-8 text-primary mb-4" />
              <CardTitle>{t("about.valuesTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("about.valuesDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto space-y-12 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("about.whyChooseTitle")}</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("about.whyChooseDescription")}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-4" />
              <CardTitle>{t("about.aiPoweredTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("about.aiPoweredDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-4" />
              <CardTitle>{t("about.fastTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("about.fastDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-4" />
              <CardTitle>{t("about.secureTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("about.secureDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 mt-auto">
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
            <p>© {new Date().getFullYear()} PodBrief. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
