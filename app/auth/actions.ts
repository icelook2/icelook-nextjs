"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, otpSchema } from "./schemas";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function signInWithOtp(email: string): Promise<ActionResult> {
  const t = await getTranslations("auth");
  const tValidation = await getTranslations("validation");

  const validation = emailSchema.safeParse(email);

  if (!validation.success) {
    // Return translated validation error
    return { success: false, error: tValidation("email_invalid") };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: validation.data,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    if (error.status === 429) {
      return {
        success: false,
        error: t("rate_limit"),
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function verifyOtp(
  email: string,
  token: string,
  redirectTo: string,
): Promise<ActionResult> {
  const t = await getTranslations("auth");
  const tValidation = await getTranslations("validation");

  const emailValidation = emailSchema.safeParse(email);
  const otpValidation = otpSchema.safeParse(token);

  if (!emailValidation.success) {
    return { success: false, error: tValidation("email_invalid") };
  }

  if (!otpValidation.success) {
    // Check which validation failed
    const issue = otpValidation.error.issues[0];
    if (issue.code === "too_small" || issue.code === "too_big") {
      return { success: false, error: tValidation("otp_length") };
    }
    return { success: false, error: tValidation("otp_numeric") };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email: emailValidation.data,
    token: otpValidation.data,
    type: "email",
  });

  if (error) {
    if (error.message.includes("expired")) {
      return {
        success: false,
        error: t("code_expired"),
      };
    }
    if (error.message.includes("invalid")) {
      return {
        success: false,
        error: t("code_invalid"),
      };
    }
    return { success: false, error: error.message };
  }

  redirect(redirectTo);
}

export async function resendOtp(email: string): Promise<ActionResult> {
  const t = await getTranslations("auth");
  const tValidation = await getTranslations("validation");

  const validation = emailSchema.safeParse(email);

  if (!validation.success) {
    return { success: false, error: tValidation("email_invalid") };
  }

  const supabase = await createClient();

  // Use shouldCreateUser: true to handle edge case where user record
  // doesn't exist yet (e.g., if initial OTP expired before verification)
  const { error } = await supabase.auth.signInWithOtp({
    email: validation.data,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    if (error.status === 429) {
      return {
        success: false,
        error: t("resend_rate_limit"),
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/auth");
}
