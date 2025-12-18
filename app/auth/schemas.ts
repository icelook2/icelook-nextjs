import { z } from "zod";

/**
 * Email schema - validation messages will be translated in components
 * using the validation namespace from translations.
 */
export const emailSchema = z.string().email();

/**
 * OTP schema - validation messages will be translated in components
 * using the validation namespace from translations.
 */
export const otpSchema = z.string().length(6).regex(/^\d+$/);

/**
 * Creates translated Zod schemas using the provided translation function.
 * Use this in components to get localized error messages.
 */
export function createTranslatedSchemas(t: (key: string) => string) {
  return {
    email: z.string().email(t("email_invalid")),
    otp: z.string().length(6, t("otp_length")).regex(/^\d+$/, t("otp_numeric")),
  };
}

/**
 * Extracts the first validation error message from a Zod SafeParseError.
 */
export function getValidationError<T>(result: z.ZodSafeParseError<T>): string {
  return result.error.issues[0].message;
}
