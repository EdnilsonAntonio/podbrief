import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar histórico de compras de créditos (faturas)
    const invoices = await prisma.creditPurchase.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limitar a 50 faturas mais recentes
    });

    // Transformar para formato da UI
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      date: invoice.createdAt,
      plan: `${invoice.amountCredits} Credits`, // Usar quantidade de créditos como "plano"
      amount: invoice.amountPaid,
      status: invoice.status,
      credits: invoice.amountCredits,
      stripePaymentId: invoice.stripePaymentId,
    }));

    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

