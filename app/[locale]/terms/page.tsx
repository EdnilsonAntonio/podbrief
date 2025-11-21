import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSelector } from "@/components/LanguageSelector";

export default async function TermsPage({
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

      {/* Content */}
      <section className="container mx-auto max-w-4xl py-20 px-4">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t("terms.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("terms.lastUpdated")}: {new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.acceptance.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.acceptance.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.description.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.description.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.userAccounts.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.userAccounts.description")}
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  {t.raw("terms.userAccounts.items").map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.creditsPayments.title")}</h2>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t("terms.creditsPayments.creditSystem.title")}</h3>
                  <p className="text-muted-foreground">
                    {t("terms.creditsPayments.creditSystem.content")}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t("terms.creditsPayments.paymentTerms.title")}</h3>
                  <p className="text-muted-foreground">
                    {t("terms.creditsPayments.paymentTerms.content")}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t("terms.creditsPayments.refunds.title")}</h3>
                  <p className="text-muted-foreground">
                    {t("terms.creditsPayments.refunds.content")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.acceptableUse.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.acceptableUse.description")}
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  {t.raw("terms.acceptableUse.items").map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.contentOwnership.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.contentOwnership.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.serviceAvailability.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.serviceAvailability.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.accuracyDisclaimer.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.accuracyDisclaimer.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.limitationLiability.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.limitationLiability.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.termination.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.termination.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.changesToTerms.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.changesToTerms.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.governingLaw.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.governingLaw.content")}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">{t("terms.contactInformation.title")}</h2>
                <p className="text-muted-foreground">
                  {t("terms.contactInformation.content")}{" "}
                  <a href="mailto:support@podbrief.online" className="text-primary hover:underline">
                    support@podbrief.online
                  </a>
                  {" "}or visit our{" "}
                  <Link href={`/${locale}/contact`} className="text-primary hover:underline">
                    {t("terms.contactPage")}
                  </Link>.
                </p>
              </div>
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
                <li><Link href={`/${locale}/dashboard`} className="hover:text-foreground">{t("common.dashboard")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href={`/${locale}/contact`} className="hover:text-foreground">{t("common.contact")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
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

