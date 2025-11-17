import { resend, FROM_EMAIL } from "@/lib/resend";

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Função para escapar HTML e prevenir XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function sendContactFormEmail({
  name,
  email,
  subject,
  message,
}: ContactFormEmailProps) {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || "support@podbrief.online";
    
    console.log("📧 Sending contact form email:", {
      from: FROM_EMAIL,
      to: supportEmail,
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: supportEmail,
      replyTo: email,
      subject: `[Contact Form] ${escapeHtml(subject)}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">PB</h1>
              </div>
              <h2 style="color: #333; margin: 0; font-size: 24px;">New Contact Form Submission</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600;">${escapeHtml(name)}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #667eea;">${escapeHtml(email)}</p>
              </div>
              
              <div style="margin-bottom: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Subject</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600;">${escapeHtml(subject)}</p>
              </div>
              
              <div style="padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
                <div style="background: white; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 15px; line-height: 1.6;">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">
                You can reply directly to this email to respond to ${escapeHtml(name)}.
              </p>
              <p style="margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} PodBrief. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error sending contact form email:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log("✅ Contact form email sent successfully:", {
      emailId: data?.id,
      to: supportEmail,
    });

    return { success: true, data };
  } catch (error) {
    console.error("❌ Exception sending contact form email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

