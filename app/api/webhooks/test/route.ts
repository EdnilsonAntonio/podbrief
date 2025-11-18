import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint de teste para verificar se o webhook está acessível
 * Útil para verificar se a URL está correta antes de configurar no Stripe
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Webhook endpoint is accessible",
    url: request.url,
    timestamp: new Date().toISOString(),
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  
  return NextResponse.json({
    message: "Webhook endpoint received request",
    hasSignature: !!signature,
    bodyLength: body.length,
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
  });
}

