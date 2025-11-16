import { resend, FROM_EMAIL } from "@/lib/resend";

interface PurchaseConfirmationEmailProps {
  to: string;
  name: string | null;
  credits: number;
  amountPaid: number;
  newBalance: number;
}

export async function sendPurchaseConfirmationEmail({
  to,
  name,
  credits,
  amountPaid,
  newBalance,
}: PurchaseConfirmationEmailProps) {
  try {
    const firstName = name?.split(" ")[0] || "there";
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Purchase Confirmed - ${credits} Credits Added! ✅`,
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
              <h2 style="color: #333; margin: 0; font-size: 24px;">Purchase Confirmed!</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                Your purchase has been successfully processed! We've added <strong>${credits} credits</strong> to your account.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Credits Purchased:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${credits}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Amount Paid:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">$${amountPaid.toFixed(2)}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e0e0e0;">
                    <td style="padding: 12px 0 8px 0; color: #333; font-weight: 600;">New Balance:</td>
                    <td style="padding: 12px 0 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: #667eea;">${newBalance} credits</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin: 20px 0 0 0; font-size: 16px;">
                You're all set! Start transcribing your audio files now.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/upload" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Upload Audio File
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">
                View your invoice in your <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings" style="color: #667eea;">account settings</a>.
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
      console.error("Error sending purchase confirmation email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending purchase confirmation email:", error);
    return { success: false, error };
  }
}

