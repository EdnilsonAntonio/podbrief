import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { TDocumentDefinitions } from "pdfmake/interfaces";
// @ts-ignore
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import pdfFonts from "pdfmake/build/vfs_fonts";

// Configurar fontes do pdfmake
// Para pdfmake 0.2.20, as fontes são exportadas diretamente como um objeto
// Precisamos criar um objeto vfs com as fontes
if (pdfFonts && typeof pdfFonts === "object") {
  // Criar objeto vfs a partir das fontes disponíveis
  const vfs: any = {};
  Object.keys(pdfFonts).forEach((key) => {
    if (key.endsWith(".ttf")) {
      vfs[key] = (pdfFonts as any)[key];
    }
  });
  (pdfMake as any).vfs = vfs;
  
  // Configurar fontes customizadas
  (pdfMake as any).fonts = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Buscar a compra de créditos
    const invoice = await prisma.creditPurchase.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono
    if (invoice.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Gerar PDF
    const pdfBuffer = await generateInvoicePDF(invoice, invoice.user);

    // Criar resposta com download
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.id}.pdf"`
    );

    return new NextResponse(pdfBuffer, { headers });
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateInvoicePDF(
  invoice: any,
  user: { email: string; name: string | null }
): Promise<Buffer> {
  const date = new Date(invoice.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [50, 50, 50, 50],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
    },
    header: {
      margin: [0, 0, 0, 20],
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: "PODBRIEF",
              fontSize: 28,
              bold: true,
              color: "#ffffff",
              fillColor: "#1a1a1a",
              alignment: "center",
              margin: [0, 15, 0, 15],
            },
          ],
          [
            {
              text: "INVOICE",
              fontSize: 16,
              color: "#ffffff",
              fillColor: "#1a1a1a",
              alignment: "center",
              margin: [0, 0, 0, 15],
            },
          ],
        ],
      },
      layout: "noBorders",
    },
    content: [
      {
        text: "Invoice Details",
        fontSize: 14,
        bold: true,
        decoration: "underline",
        margin: [0, 0, 0, 10],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Invoice ID: ", bold: true },
              { text: invoice.id },
            ],
          },
        ],
        margin: [20, 0, 0, 5],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Date: ", bold: true },
              { text: date },
            ],
          },
        ],
        margin: [20, 0, 0, 5],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Status: ", bold: true },
              { text: invoice.status.toUpperCase() },
            ],
          },
        ],
        margin: [20, 0, 0, 10],
      },
      {
        text: "Billing Information",
        fontSize: 14,
        bold: true,
        decoration: "underline",
        margin: [0, 20, 0, 10],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Customer: ", bold: true },
              { text: user.name || user.email },
            ],
          },
        ],
        margin: [20, 0, 0, 5],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Email: ", bold: true },
              { text: user.email },
            ],
          },
        ],
        margin: [20, 0, 0, 10],
      },
      {
        text: "Purchase Details",
        fontSize: 14,
        bold: true,
        decoration: "underline",
        margin: [0, 20, 0, 10],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Credits Purchased: ", bold: true },
              { text: invoice.amountCredits.toString() },
            ],
          },
        ],
        margin: [20, 0, 0, 5],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Amount Paid: ", bold: true },
              { text: `$${invoice.amountPaid.toFixed(2)}` },
            ],
          },
        ],
        margin: [20, 0, 0, 5],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Payment Method: ", bold: true },
              { text: "Stripe" },
            ],
          },
        ],
        margin: [20, 0, 0, 5],
      },
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Transaction ID: ", bold: true },
              { text: invoice.stripePaymentId || "N/A" },
            ],
          },
        ],
        margin: [20, 0, 0, 20],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: "Summary",
                fontSize: 14,
                bold: true,
                fillColor: "#f5f5f5",
                margin: [10, 10, 10, 5],
              },
            ],
            [
              {
                text: [
                  { text: "Total Amount: ", fontSize: 12 },
                  { text: `$${invoice.amountPaid.toFixed(2)}`, fontSize: 12, bold: true },
                ],
                fillColor: "#f5f5f5",
                margin: [10, 5, 10, 5],
              },
            ],
            [
              {
                text: [
                  { text: "Payment Status: ", fontSize: 11 },
                  { text: invoice.status.toUpperCase(), fontSize: 11, bold: true },
                ],
                fillColor: "#f5f5f5",
                margin: [10, 5, 10, 10],
              },
            ],
          ],
        },
        layout: {
          defaultBorder: true,
        },
        margin: [0, 20, 0, 40],
      },
    ],
    footer: function (currentPage: number, pageCount: number) {
      return {
        margin: [50, 20, 50, 0],
        text: [
          {
            text: "Thank you for your purchase!\n",
            fontSize: 8,
            alignment: "center",
          },
          {
            text: "For support, please contact us at support@podbrief.com",
            fontSize: 8,
            alignment: "center",
          },
        ],
      };
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = (pdfMake as any).createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
}
