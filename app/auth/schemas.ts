import {
  createTranslatedEmailSchema,
  createTranslatedOtpSchema,
  emailSchema,
  getValidationError,
  otpSchema,
} from "@/lib/validation/schemas";

// Re-export from shared validation schemas
export {
  createTranslatedEmailSchema,
  createTranslatedOtpSchema,
  emailSchema,
  getValidationError,
  otpSchema,
};

/**
 * Creates translated Zod schemas using the provided translation function.
 * Use this in components to get localized error messages.
 */
export function createTranslatedSchemas(t: (key: string) => string) {
  return {
    email: createTranslatedEmailSchema(t),
    otp: createTranslatedOtpSchema(t),
  };
}
