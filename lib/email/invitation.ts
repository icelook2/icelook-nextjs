import { sendEmail } from "./client";

interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  beautyPageName: string;
  roles: ("admin" | "specialist")[];
  token: string;
}

function getRolesText(roles: ("admin" | "specialist")[]): string {
  if (roles.includes("admin") && roles.includes("specialist")) {
    return "Admin & Specialist";
  }
  if (roles.includes("admin")) {
    return "Admin";
  }
  return "Specialist";
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_IL_APP_URL) {
    return process.env.NEXT_PUBLIC_IL_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function sendInvitationEmail({
  to,
  inviterName,
  beautyPageName,
  roles,
  token,
}: SendInvitationEmailParams): Promise<void> {
  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const rolesText = getRolesText(roles);

  // Plain HTML template
  const html = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>You're invited to join ${beautyPageName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
 <h1 style="font-size: 24px; margin-bottom: 16px;">You're invited!</h1>

 <p>${inviterName} has invited you to join <strong>${beautyPageName}</strong> on Icelook as a <strong>${rolesText}</strong>.</p>

 <p>Click the button below to accept the invitation:</p>

 <p style="margin: 24px 0;">
 <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
 Accept Invitation
 </a>
 </p>

 <p style="font-size: 14px;">
 Or copy and paste this link into your browser:<br>
 <a href="${inviteUrl}">${inviteUrl}</a>
 </p>

 <hr style="none; border-top: 1px solid; margin: 32px 0;">

 <p style="font-size: 12px;">
 This invitation was sent by Icelook. If you didn't expect this email, you can safely ignore it.
 </p>
</body>
</html>
 `.trim();

  const result = await sendEmail({
    to,
    subject: `${inviterName} invited you to join ${beautyPageName}`,
    html,
  });

  if (!result.success) {
    throw new Error(result.error ?? "Failed to send invitation email");
  }
}
