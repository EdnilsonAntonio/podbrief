import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";

export default async function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using PodBrief ("the Service"), you accept and agree to be bound by 
                  the terms and provision of this agreement. If you do not agree to these Terms of Service, 
                  please do not use our Service.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  PodBrief provides AI-powered audio transcription and summarization services. We use 
                  OpenAI's Whisper and GPT models to transcribe audio files and generate summaries, 
                  keywords, and insights.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">3. User Accounts</h2>
                <p className="text-muted-foreground">
                  To use our Service, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">4. Credits and Payments</h2>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">4.1 Credit System</h3>
                  <p className="text-muted-foreground">
                    Our Service operates on a credit-based system. Credits are purchased in advance and 
                    used to transcribe audio files. One credit equals one minute of transcription.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">4.2 Payment Terms</h3>
                  <p className="text-muted-foreground">
                    All payments are processed securely through Stripe. By making a purchase, you agree to 
                    Stripe's terms of service. Prices are displayed in USD and are subject to change.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">4.3 Refunds</h3>
                  <p className="text-muted-foreground">
                    Credits are non-refundable but never expire. You can use purchased credits at any time. 
                    If you experience technical issues, please contact support for assistance.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">5. Acceptable Use</h2>
                <p className="text-muted-foreground">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Upload content that is illegal, harmful, or violates any laws</li>
                  <li>Upload content that infringes on intellectual property rights</li>
                  <li>Upload content containing malware, viruses, or harmful code</li>
                  <li>Attempt to reverse engineer or compromise the Service</li>
                  <li>Use the Service for any unauthorized commercial purposes</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">6. Content Ownership</h2>
                <p className="text-muted-foreground">
                  You retain all ownership rights to the audio files you upload and the transcriptions 
                  generated from them. By using our Service, you grant us a limited license to process 
                  your files solely for the purpose of providing transcription services.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">7. Service Availability</h2>
                <p className="text-muted-foreground">
                  We strive to provide reliable service but do not guarantee uninterrupted or error-free 
                  operation. The Service may be unavailable due to maintenance, technical issues, or 
                  circumstances beyond our control.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">8. Accuracy Disclaimer</h2>
                <p className="text-muted-foreground">
                  While we use industry-leading AI technology, transcriptions may contain errors, 
                  especially with poor audio quality, accents, or specialized terminology. We recommend 
                  reviewing and editing transcriptions for accuracy.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, PodBrief shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, or any loss of profits or 
                  revenues, whether incurred directly or indirectly.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">10. Termination</h2>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your account at any time for violation of 
                  these Terms or for any other reason. You may delete your account at any time through 
                  your account settings.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">11. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms at any time. We will notify users of 
                  significant changes via email or through the Service. Continued use of the Service 
                  after changes constitutes acceptance of the new Terms.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">12. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with applicable laws, 
                  without regard to conflict of law provisions.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">13. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:support@podbrief.online" className="text-primary hover:underline">
                    support@podbrief.online
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

