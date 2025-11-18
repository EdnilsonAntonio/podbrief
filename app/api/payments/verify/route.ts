import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/db/prisma";

/**
 * Endpoint para verificar e processar manualmente pagamentos pendentes
 * Útil para debug e para processar pagamentos que não foram processados pelo webhook
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Verifying payment session: ${sessionId} for user: ${user.id}`);

    // Buscar a sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log(`📋 Session details:`, {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      metadata: session.metadata,
    });

    // Verificar se o pagamento foi concluído
    if (session.payment_status !== "paid") {
      return NextResponse.json({
        success: false,
        message: `Payment not completed. Status: ${session.payment_status}`,
        session: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
        },
      });
    }

    // Verificar se já foi processado
    const existingPurchase = await prisma.creditPurchase.findUnique({
      where: { stripePaymentId: session.id },
    });

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        purchase: {
          id: existingPurchase.id,
          credits: existingPurchase.amountCredits,
          status: existingPurchase.status,
        },
        userCredits: user.credits,
      });
    }

    // Verificar se o usuário da sessão corresponde ao usuário logado
    const sessionUserId = session.metadata?.userId;
    if (sessionUserId !== user.id) {
      return NextResponse.json(
        {
          error: "This payment does not belong to the current user",
          sessionUserId,
          currentUserId: user.id,
        },
        { status: 403 }
      );
    }

    // Extrair metadados
    const credits = parseInt(session.metadata?.credits || "0");
    const amountPaid = parseFloat(session.metadata?.amountPaid || "0");

    if (!credits) {
      return NextResponse.json(
        {
          error: "Invalid metadata: credits not found",
          metadata: session.metadata,
        },
        { status: 400 }
      );
    }

    // Processar o pagamento
    console.log(`💰 Processing payment: ${credits} credits, $${amountPaid}`);

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

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: newCredits,
      },
    });

    console.log(
      `✅ Payment processed: Added ${credits} credits. New balance: ${updatedUser.credits}`
    );

    // Enviar email de confirmação
    import("@/lib/emails").then(({ sendPurchaseConfirmationEmail }) => {
      sendPurchaseConfirmationEmail({
        to: updatedUser.email,
        name: updatedUser.name,
        credits,
        amountPaid,
        newBalance: updatedUser.credits,
      }).catch((error) => {
        console.error("Failed to send purchase confirmation email:", error);
      });
    });

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      purchase: {
        id: creditPurchase.id,
        credits: creditPurchase.amountCredits,
        amountPaid: creditPurchase.amountPaid,
      },
      userCredits: updatedUser.credits,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

