"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Preencher session_id da URL se disponível
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get("session_id");
    if (sessionIdFromUrl) {
      setSessionId(sessionIdFromUrl);
    }
  }, [searchParams]);

  const handleVerify = async () => {
    if (!sessionId.trim()) {
      toast.error("Please enter a session ID");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: sessionId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to verify payment");
      }

      setResult(data);
      toast.success(data.message || "Payment verified and processed successfully!");
    } catch (error: any) {
      console.error("Verify payment error:", error);
      toast.error(error.message || "Failed to verify payment");
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Verify Payment</CardTitle>
          <CardDescription>
            If your credits were not added after a successful payment, enter your Stripe session ID here to process it manually.
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              💡 <strong>Dica:</strong> O Session ID aparece na URL após o pagamento, ou você pode encontrá-lo em{" "}
              <a 
                href="https://dashboard.stripe.com/test/events" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Stripe Dashboard → Developers → Events
              </a>
              {" "}procurando por eventos do tipo <code className="bg-muted px-1 rounded">checkout.session.completed</code>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="sessionId" className="text-sm font-medium">
              Stripe Session ID
            </label>
            <Input
              id="sessionId"
              placeholder="cs_test_..."
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              <strong>Onde encontrar:</strong>
              <br />
              • Na URL após o pagamento: <code className="bg-muted px-1 rounded">?session_id=cs_test_...</code>
              <br />
              • Stripe Dashboard → <strong>Developers</strong> → <strong>Events</strong> → procurar por <code className="bg-muted px-1 rounded">checkout.session.completed</code>
              <br />
              • Ou em <strong>Developers</strong> → <strong>Webhooks</strong> → ver eventos recebidos
            </p>
          </div>

          <Button onClick={handleVerify} disabled={loading || !sessionId.trim()}>
            {loading ? "Verifying..." : "Verify & Process Payment"}
          </Button>

          {result && (
            <div className="mt-4 space-y-2">
              {result.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">{result.message}</p>
                      {result.purchase && (
                        <div className="text-sm">
                          <p>Credits added: {result.purchase.credits}</p>
                          <p>Amount paid: ${result.purchase.amountPaid}</p>
                        </div>
                      )}
                      {result.userCredits !== undefined && (
                        <p className="text-sm font-semibold">
                          Your new credit balance: {result.userCredits}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Verify Payment</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyPaymentContent />
    </Suspense>
  );
}

