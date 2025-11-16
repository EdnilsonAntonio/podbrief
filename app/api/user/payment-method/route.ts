import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/db/prisma";

// GET - Obter link para gerenciar método de pagamento
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar ou criar customer no Stripe
    let customerId: string | null = null;
    
    // Verificar se já existe um customer ID no banco (podemos adicionar esse campo depois)
    // Por enquanto, vamos criar um customer baseado no email
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Buscar customer existente no Stripe por email
    const customers = await stripe.customers.list({
      email: userProfile.email,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      customerId = customer.id;
    } else {
      // Criar novo customer
      customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Criar sessão do Customer Portal do Stripe
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Error creating payment method portal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment method portal" },
      { status: 500 }
    );
  }
}

