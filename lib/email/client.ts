import nodemailer from "nodemailer";
import { Resend } from "resend";

// Check if we're in development mode (use Mailpit) or production (use Resend)
const isDevelopment = process.env.NODE_ENV === "development";

// Resend client for production
const resend = process.env.IL_RESEND_API_KEY
  ? new Resend(process.env.IL_RESEND_API_KEY)
  : null;

// Nodemailer transport for local development (Supabase Mailpit)
// Mailpit runs on port 54326 for SMTP (inboxes viewable at http://127.0.0.1:54424)
const localTransport = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 54326,
  secure: false,
});

export const EMAIL_FROM =
  process.env.IL_EMAIL_FROM ?? "Icelook <noreply@icelook.app>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (isDevelopment) {
    // Use Mailpit for local development
    try {
      await localTransport.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log(`[DEV] Email sent to ${to}. View at http://127.0.0.1:54324`);
      return { success: true };
    } catch (error) {
      console.error("Failed to send email via Mailpit:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }

  // Use Resend for production
  if (!resend) {
    console.error("IL_RESEND_API_KEY is not set. Cannot send email.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email via Resend:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
