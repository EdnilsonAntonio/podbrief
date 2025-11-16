import { resend, FROM_EMAIL } from "@/lib/resend";

interface WelcomeEmailProps {
  to: string;
  name: string | null;
}

export async function sendWelcomeEmail({ to, name }: WelcomeEmailProps) {
  try {
    const firstName = name?.split(" ")[0] || "there";
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to PodBrief! 🎉",
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
              <h2 style="color: #333; margin: 0; font-size: 24px;">Welcome to PodBrief!</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                We're thrilled to have you join PodBrief! You're now part of a community that's transforming how people work with audio content.
              </p>
              <p style="margin: 0; font-size: 16px;">
                Get started by uploading your first audio file and watch as our AI-powered transcription and summarization tools work their magic.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/upload" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Upload Your First Audio
              </a>
            </div>
            
            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">
                <strong>What you can do with PodBrief:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Transcribe audio files with industry-leading accuracy</li>
                <li>Generate AI-powered summaries and insights</li>
                <li>Export transcriptions in multiple formats (TXT, JSON, SRT)</li>
                <li>Share transcriptions publicly or keep them private</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">
                Need help? Visit our <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contact" style="color: #667eea;">contact page</a> or reply to this email.
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
      console.error("Error sending welcome email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

