import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { PRICING_PLANS } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, locale = "en" } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Buscar o plano
    const plan = PRICING_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Buscar o Price ID do Stripe do .env
    // Formato esperado: STRIPE_PRICE_STARTER, STRIPE_PRICE_CREATOR, etc.
    const priceIdEnvKey = `STRIPE_PRICE_${planId.toUpperCase()}`;
    const priceId = process.env[priceIdEnvKey];

    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe Price ID not configured for plan ${planId}. Please set ${priceIdEnvKey} in .env` },
        { status: 500 }
      );
    }

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/pricing?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: plan.id,
        credits: plan.credits.toString(),
        amountPaid: plan.price.toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

