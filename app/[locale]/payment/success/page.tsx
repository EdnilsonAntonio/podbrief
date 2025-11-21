"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"processing" | "success" | "error" | "already_processed">("processing");
  const [message, setMessage] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage(t("payment.noSessionId"));
      return;
    }

    const processPayment = async () => {
      try {
        setStatus("processing");
        setMessage(t("payment.processingDescription"));

        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.message?.includes("already processed") || data.purchase) {
            setStatus("already_processed");
            setMessage(t("payment.alreadyProcessed"));
            if (data.purchase) {
              setCredits(data.purchase.credits);
            }
            if (data.userCredits !== undefined) {
              setNewBalance(data.userCredits);
            }
          } else {
            throw new Error(data.error || data.message || t("payment.errorDescription"));
          }
        } else {
          setStatus("success");
          setMessage(t("payment.successDescription"));
          if (data.purchase) {
            setCredits(data.purchase.credits);
          }
          if (data.userCredits !== undefined) {
            setNewBalance(data.userCredits);
          }
        }
      } catch (error: any) {
        console.error("Payment processing error:", error);
        setStatus("error");
        setMessage(error.message || t("payment.errorDescription"));
      }
    };

    processPayment();
  }, [sessionId, t]);

  const handleGoToDashboard = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "processing" && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === "already_processed" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
            {status === "success" || status === "already_processed" 
              ? t("payment.success") 
              : status === "error" 
              ? t("payment.error") 
              : t("payment.processing")}
          </CardTitle>
          <CardDescription>
            {status === "processing" && t("payment.processingDescription")}
            {status === "success" && t("payment.successDescription")}
            {status === "already_processed" && t("payment.alreadyProcessed")}
            {status === "error" && t("payment.errorDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "processing" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {(status === "success" || status === "already_processed") && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{message}</p>
                  {credits && (
                    <p className="text-sm">
                      <strong>{t("payment.creditsAdded")}</strong> {Math.round(credits * 100) / 100}
                    </p>
                  )}
                  {newBalance !== null && (
                    <p className="text-sm">
                      <strong>{t("payment.newBalance")}</strong> {Math.round(newBalance * 100) / 100} {t("payment.credits")}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{message}</p>
                  <p className="text-sm">
                    {t("payment.contactSupport")}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            {(status === "success" || status === "already_processed") && (
              <Button onClick={handleGoToDashboard} className="w-full">
                {t("common.goToDashboard")}
              </Button>
            )}
            {status === "error" && (
              <>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1"
                >
                  {t("payment.tryAgain")}
                </Button>
                <Button
                  onClick={handleGoToDashboard}
                  variant="outline"
                  className="flex-1"
                >
                  {t("common.goToDashboard")}
                </Button>
              </>
            )}
          </div>

          {sessionId && (
            <p className="text-xs text-muted-foreground text-center pt-4">
              Session ID: {sessionId.substring(0, 20)}...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const t = useTranslations();
  
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("payment.processing")}</CardTitle>
              <CardDescription>{t("payment.pleaseWait")}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

