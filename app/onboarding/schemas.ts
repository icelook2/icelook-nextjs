import { z } from "zod";

/**
 * Name schema - validation messages will be translated in components.
 */
export const nameSchema = z.string().min(2).max(100).trim();

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
 * Extracts the first validation error message from a Zod SafeParseError.
 */
export function getValidationError<T>(result: z.ZodSafeParseError<T>): string {
  return result.error.issues[0].message;
}
