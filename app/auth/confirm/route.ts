import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase email confirmation links.
 * When a user clicks a confirmation link, Supabase redirects to this route
 * with token_hash and type parameters.
 *
 * For email change with "Secure email change" enabled:
 * - User receives links in both old and new email
 * - Each click confirms one side of the change
 * - After both clicks, the email is changed
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/settings";

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/settings?error=missing_confirmation_params`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "email_change" | "signup" | "recovery" | "email",
  });

  if (error) {
    console.error("Email confirmation error:", error.message);
    return NextResponse.redirect(
      `${origin}/settings?error=confirmation_failed`,
    );
  }

  // Successful confirmation - redirect to settings with success message
  return NextResponse.redirect(`${origin}${next}?email_confirmed=true`);
}
