"use server";

import { redirect } from "next/navigation";
import { emailSchema, otpSchema } from "@/lib/validation/schemas";
import { resolvePostLoginDestination } from "@/lib/auth/landing";
import { getUser } from "@/lib/auth/session";
import { sendOtpServer, signOutServer, verifyOtpServer } from "@/lib/api/auth-mutations-server";

export type AuthActionResult =
  | { success: true; redirectTo?: string }
  | { success: false; error: string };

function getValidationErrorMessage(field: "email" | "otp") {
  if (field === "email") {
    return "Please enter a valid email address.";
  }

  return "Code must be 6 digits.";
}

export async function sendOtpAction(email: string): Promise<AuthActionResult> {
  const parsedEmail = emailSchema.safeParse(email.trim());
  if (!parsedEmail.success) {
    return { success: false, error: getValidationErrorMessage("email") };
  }

  return sendOtpServer(parsedEmail.data);
}

export async function resendOtpAction(email: string): Promise<AuthActionResult> {
  return sendOtpAction(email);
}

export async function verifyOtpAction(
  email: string,
  otp: string,
): Promise<AuthActionResult> {
  const parsedEmail = emailSchema.safeParse(email.trim());
  if (!parsedEmail.success) {
    return { success: false, error: getValidationErrorMessage("email") };
  }

  const parsedOtp = otpSchema.safeParse(otp.trim());
  if (!parsedOtp.success) {
    return { success: false, error: getValidationErrorMessage("otp") };
  }

  const verifyResult = await verifyOtpServer(parsedEmail.data, parsedOtp.data);
  if (!verifyResult.success) {
    return verifyResult;
  }

  const user = await getUser();

  if (!user) {
    return {
      success: false,
      error: "Sign-in completed, but no session is available yet. Please try again.",
    };
  }

  const redirectTo = await resolvePostLoginDestination(user.id);

  redirect(redirectTo);
}

export async function signOutAction(): Promise<AuthActionResult> {
  const result = await signOutServer();
  if (!result.success) {
    return result;
  }

  redirect("/auth");
}
