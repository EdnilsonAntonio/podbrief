import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/db/prisma";
import Stripe from "stripe";

// IMPORTANTE: Esta rota deve ser acessível sem autenticação
// O Stripe precisa poder chamar este endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Processar eventos
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Verificar se já processamos este pagamento
      const existingPurchase = await prisma.creditPurchase.findUnique({
        where: { stripePaymentId: session.id },
      });

      if (existingPurchase) {
        console.log(`Payment ${session.id} already processed`);
        return NextResponse.json({ received: true });
      }

      // Extrair metadados
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const credits = parseInt(session.metadata?.credits || "0");
      const amountPaid = parseFloat(session.metadata?.amountPaid || "0");

      if (!userId || !credits) {
        console.error("Missing metadata in session:", session.id);
        return NextResponse.json(
          { error: "Missing required metadata" },
          { status: 400 }
        );
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.error("User not found:", userId);
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Criar registro de compra
      const creditPurchase = await prisma.creditPurchase.create({
        data: {
          userId: user.id,
          stripePaymentId: session.id,
          amountCredits: credits,
          amountPaid: amountPaid,
          status: "succeeded",
        },
      });

      // Adicionar créditos ao usuário
      const currentCredits = user.credits;
      const newCredits = currentCredits + credits;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: newCredits,
        },
      });

      console.log(
        `Added ${credits} credits to user ${user.id}. New balance: ${newCredits}`
      );

      // Enviar email de confirmação de compra (assíncrono, não bloqueia)
      import("@/lib/emails").then(({ sendPurchaseConfirmationEmail }) => {
        sendPurchaseConfirmationEmail({
          to: user.email,
          name: user.name,
          credits,
          amountPaid,
          newBalance: newCredits,
        }).catch((error) => {
          console.error("Failed to send purchase confirmation email:", error);
        });
      });
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      // Pagamento assíncrono bem-sucedido (ex: banco)
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || "0");

      if (userId && credits) {
        const purchase = await prisma.creditPurchase.findUnique({
          where: { stripePaymentId: session.id },
        });

        if (purchase && purchase.status !== "succeeded") {
          await prisma.creditPurchase.update({
            where: { id: purchase.id },
            data: { status: "succeeded" },
          });

          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (user) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                credits: user.credits + credits,
              },
            });
          }
        }
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      // Pagamento falhou
      const session = event.data.object as Stripe.Checkout.Session;

      const purchase = await prisma.creditPurchase.findUnique({
        where: { stripePaymentId: session.id },
      });

      if (purchase) {
        await prisma.creditPurchase.update({
          where: { id: purchase.id },
          data: { status: "failed" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

