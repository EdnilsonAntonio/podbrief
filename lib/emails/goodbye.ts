import { resend, FROM_EMAIL } from "@/lib/resend";

interface GoodbyeEmailProps {
  to: string;
  name: string | null;
}

export async function sendGoodbyeEmail({ to, name }: GoodbyeEmailProps) {
  try {
    const firstName = name?.split(" ")[0] || "there";
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "We're sorry to see you go - PodBrief",
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
              <h2 style="color: #333; margin: 0; font-size: 24px;">Account Deleted</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                We're sorry to see you go. Your PodBrief account has been successfully deleted, along with all associated data, transcriptions, and files.
              </p>
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                If you change your mind, you can always create a new account and start fresh. We'd love to have you back!
              </p>
              <p style="margin: 0; font-size: 16px;">
                Thank you for being part of the PodBrief community. We hope to see you again in the future.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Visit PodBrief
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">
                <strong>What was deleted:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #856404;">
                <li>Your account and profile information</li>
                <li>All transcriptions and summaries</li>
                <li>All uploaded audio files</li>
                <li>Credit purchase history</li>
                <li>All other account data</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">
                If you have any questions or feedback, please don't hesitate to <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contact" style="color: #667eea;">contact us</a>.
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
      console.error("Error sending goodbye email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending goodbye email:", error);
    return { success: false, error };
  }
}

