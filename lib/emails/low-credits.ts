import { resend, FROM_EMAIL } from "@/lib/resend";

interface LowCreditsEmailProps {
  to: string;
  name: string | null;
  currentCredits: number;
}

export async function sendLowCreditsEmail({
  to,
  name,
  currentCredits,
}: LowCreditsEmailProps) {
  try {
    const firstName = name?.split(" ")[0] || "there";
    const creditsDisplay = currentCredits % 1 === 0 
      ? currentCredits.toFixed(0) 
      : currentCredits.toFixed(2);
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Low Credits Alert - PodBrief ⚠️",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">PB</h1>
              </div>
              <h2 style="color: #333; margin: 0; font-size: 24px;">Low Credits Alert</h2>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                This is a friendly reminder that your PodBrief account is running low on credits.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Current Balance</p>
                <p style="margin: 0; font-size: 32px; font-weight: 700; color: #f59e0b;">${creditsDisplay} credits</p>
              </div>
              
              <p style="margin: 20px 0 0 0; font-size: 16px;">
                To continue transcribing your audio files without interruption, consider purchasing more credits now.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Purchase More Credits
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                <strong>Why purchase now?</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666;">
                <li>Credits never expire</li>
                <li>Use them anytime, at your own pace</li>
                <li>No subscription required</li>
                <li>Best value with our credit packages</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">
                Questions? Visit our <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contact" style="color: #667eea;">contact page</a>.
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
      console.error("Error sending low credits email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending low credits email:", error);
    return { success: false, error };
  }
}

