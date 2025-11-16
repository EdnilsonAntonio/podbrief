import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";

export default async function PrivacyPage() {
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

      {/* Content */}
      <section className="container mx-auto max-w-4xl py-20 px-4">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Introduction</h2>
                <p className="text-muted-foreground">
                  PodBrief ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our 
                  service.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2.1 Personal Information</h3>
                  <p className="text-muted-foreground">
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Name and email address (via authentication provider)</li>
                    <li>Profile information (name, profile picture)</li>
                    <li>Payment information (processed securely through Stripe)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2.2 Audio Files</h3>
                  <p className="text-muted-foreground">
                    When you upload audio files for transcription:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Files are stored temporarily on our servers</li>
                    <li>Files are processed using OpenAI's Whisper API</li>
                    <li>Files may be deleted after processing or after a retention period</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2.3 Usage Data</h3>
                  <p className="text-muted-foreground">
                    We automatically collect information about how you use our service, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Transcription history and usage patterns</li>
                    <li>Credit purchases and consumption</li>
                    <li>Device and browser information</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transcriptions and generate summaries</li>
                  <li>Process payments and manage your account</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">4. Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li><strong>Service Providers:</strong> We use OpenAI to process transcriptions. Audio files are sent to OpenAI's servers for processing.</li>
                  <li><strong>Payment Processing:</strong> We use Stripe to process payments. Payment information is handled by Stripe and not stored on our servers.</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">5. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your information. 
                  However, no method of transmission over the Internet is 100% secure. While we strive to 
                  protect your data, we cannot guarantee absolute security.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">6. Your Rights</h2>
                <p className="text-muted-foreground">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Access and update your personal information through your account settings</li>
                  <li>Delete your account and associated data</li>
                  <li>Request a copy of your data</li>
                  <li>Opt out of certain communications</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">7. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your information for as long as your account is active or as needed to provide 
                  services. Audio files may be deleted after processing or after a retention period. 
                  You can delete your account and associated data at any time.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our service is not intended for children under 13 years of age. We do not knowingly 
                  collect personal information from children under 13.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:support@podbrief.com" className="text-primary hover:underline">
                    support@podbrief.com
                  </a>
                  {" "}or visit our{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    contact page
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

