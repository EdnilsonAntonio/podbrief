import { NextRequest, NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/emails/contact-form";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validação básica
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Enviar email
    console.log("📝 Contact form submission received:", {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      messageLength: message.trim().length,
    });

    const result = await sendContactFormEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    if (!result.success) {
      console.error("❌ Failed to send contact form email:", result.error);
      console.error("Error details:", JSON.stringify(result.error, null, 2));
      return NextResponse.json(
        { 
          error: "Failed to send message. Please try again later.",
          details: process.env.NODE_ENV === "development" ? result.error : undefined
        },
        { status: 500 }
      );
    }

    console.log("✅ Contact form email sent successfully");

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

