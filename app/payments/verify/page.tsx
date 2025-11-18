"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function VerifyPaymentPage() {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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
              You can find this in your Stripe Dashboard → Payments → Checkout Sessions
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

