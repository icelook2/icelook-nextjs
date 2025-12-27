import { z } from "zod";

/**
 * Name schema - validation messages will be translated in components.
 * Used for profile names in onboarding and settings.
 */
export const nameSchema = z.string().min(2).max(100).trim();

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
 * Creates translated name schema using the provided translation function.
 * Use this in components to get localized error messages.
 */
export function createTranslatedNameSchema(t: (key: string) => string) {
  return z
    .string()
    .min(2, t("name_too_short"))
    .max(100, t("name_too_long"))
    .trim();
}

/**
 * Creates translated email schema using the provided translation function.
 */
export function createTranslatedEmailSchema(t: (key: string) => string) {
  return z.string().email(t("email_invalid"));
}

/**
 * Creates translated OTP schema using the provided translation function.
 */
export function createTranslatedOtpSchema(t: (key: string) => string) {
  return z.string().length(6, t("otp_length")).regex(/^\d+$/, t("otp_numeric"));
}

/**
 * Extracts the first validation error message from a Zod SafeParseError.
 */
export function getValidationError<T>(result: z.ZodSafeParseError<T>): string {
  return result.error.issues[0].message;
}

// ============================================================================
// Beauty Page Schemas
// ============================================================================

/**
 * Beauty page name schema - 2-100 characters
 */
export const beautyPageNameSchema = z.string().min(2).max(100).trim();

/**
 * Beauty page slug (nickname) schema - lowercase letters, numbers, and hyphens
 * Must start with a letter, 3-30 characters
 */
export const beautyPageSlugSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/);

/**
 * Reserved slugs that cannot be used for beauty pages
 */
export const RESERVED_SLUGS = [
  "auth",
  "onboarding",
  "settings",
  "search",
  "appointments",
  "beauty-pages",
  "api",
  "admin",
  "help",
  "support",
  "about",
  "privacy",
  "terms",
] as const;

/**
 * Creates translated beauty page name schema
 */
export function createTranslatedBeautyPageNameSchema(
  t: (key: string) => string,
) {
  return z
    .string()
    .min(2, t("beauty_page_name_too_short"))
    .max(100, t("beauty_page_name_too_long"))
    .trim();
}

/**
 * Creates translated beauty page slug schema
 */
export function createTranslatedBeautyPageSlugSchema(
  t: (key: string) => string,
) {
  return z
    .string()
    .min(3, t("beauty_page_slug_too_short"))
    .max(30, t("beauty_page_slug_too_long"))
    .regex(
      /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
      t("beauty_page_slug_invalid_format"),
    )
    .refine((slug) => !RESERVED_SLUGS.includes(slug as never), {
      message: t("beauty_page_slug_reserved"),
    });
}
