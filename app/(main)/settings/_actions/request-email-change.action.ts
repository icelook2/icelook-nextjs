"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "../schemas";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Initiates an email change by sending an OTP to the new email address.
 * The user must verify the OTP to complete the email change.
 */
export async function requestEmailChange(
  newEmail: string,
): Promise<ActionResult> {
  const t = await getTranslations("settings");
  const tValidation = await getTranslations("validation");

  const validation = emailSchema.safeParse(newEmail);

  if (!validation.success) {
    return { success: false, error: tValidation("email_invalid") };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Check if trying to set the same email
  if (user.email === validation.data) {
    return { success: false, error: t("same_email") };
  }

  // Request email change - Supabase sends OTP to new email
  const { error } = await supabase.auth.updateUser({
    email: validation.data,
  });

  if (error) {
    // Handle rate limiting
    if (error.status === 429) {
      return { success: false, error: t("rate_limit") };
    }
    return { success: false, error: t("email_change_failed") };
  }

  return { success: true };
}
