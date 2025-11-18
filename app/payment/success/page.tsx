"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"processing" | "success" | "error" | "already_processed">("processing");
  const [message, setMessage] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage("No session ID found. Please contact support if you completed a payment.");
      return;
    }

    // Processar o pagamento automaticamente
    const processPayment = async () => {
      try {
        setStatus("processing");
        setMessage("Processing your payment...");

        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Se já foi processado, isso é OK
          if (data.message?.includes("already processed") || data.purchase) {
            setStatus("already_processed");
            setMessage("Payment already processed successfully!");
            if (data.purchase) {
              setCredits(data.purchase.credits);
            }
            if (data.userCredits !== undefined) {
              setNewBalance(data.userCredits);
            }
          } else {
            throw new Error(data.error || data.message || "Failed to process payment");
          }
        } else {
          setStatus("success");
          setMessage(data.message || "Payment processed successfully!");
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
        setMessage(error.message || "Failed to process payment. Please try again or contact support.");
      }
    };

    processPayment();
  }, [sessionId]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
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
            Payment {status === "success" || status === "already_processed" ? "Successful" : status === "error" ? "Error" : "Processing"}
          </CardTitle>
          <CardDescription>
            {status === "processing" && "Please wait while we process your payment..."}
            {status === "success" && "Your payment has been processed and credits have been added to your account."}
            {status === "already_processed" && "Your payment was already processed successfully."}
            {status === "error" && "There was an error processing your payment."}
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
                      <strong>Credits added:</strong> {credits}
                    </p>
                  )}
                  {newBalance !== null && (
                    <p className="text-sm">
                      <strong>Your new balance:</strong> {newBalance} credits
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
                    If you completed a payment, please contact support with your payment details.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            {(status === "success" || status === "already_processed") && (
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            )}
            {status === "error" && (
              <>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleGoToDashboard}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Dashboard
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
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Processing Payment...</CardTitle>
              <CardDescription>Please wait...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

