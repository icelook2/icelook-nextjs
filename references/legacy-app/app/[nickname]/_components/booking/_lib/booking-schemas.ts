/**
 * Booking Form Validation Schemas
 *
 * Zod schemas for validating guest booking form input.
 */

import { z } from "zod";

/** Translations for validation error messages */
export interface GuestInfoValidationMessages {
  nameTooShort: string;
  nameTooLong: string;
  phoneTooShort: string;
  phoneTooLong: string;
  phoneInvalidFormat: string;
  emailInvalid: string;
  notesTooLong: string;
}

/**
 * Create a guest info validation schema with translated error messages.
 *
 * @param messages - Translated validation error messages
 * @returns Zod schema for guest info
 */
export function createGuestInfoSchema(messages: GuestInfoValidationMessages) {
  return z.object({
    name: z
      .string()
      .min(2, messages.nameTooShort)
      .max(100, messages.nameTooLong)
      .trim(),
    phone: z
      .string()
      .min(10, messages.phoneTooShort)
      .max(20, messages.phoneTooLong)
      .regex(/^[+]?[\d\s\-()]+$/, messages.phoneInvalidFormat),
    email: z.string().email(messages.emailInvalid).optional().or(z.literal("")),
    notes: z.string().max(500, messages.notesTooLong).optional(),
  });
}

/** Type inferred from the schema */
export type GuestInfoFormData = z.infer<
  ReturnType<typeof createGuestInfoSchema>
>;

/** Translations for authenticated user validation messages */
export interface AuthUserValidationMessages {
  notesTooLong: string;
}

/**
 * Create a validation schema for authenticated users.
 * Only notes (optional) is needed since name, email, and phone
 * come from the user's profile or are not required.
 *
 * @param messages - Translated validation error messages
 * @returns Zod schema for authenticated user booking
 */
export function createAuthUserSchema(messages: AuthUserValidationMessages) {
  return z.object({
    notes: z.string().max(500, messages.notesTooLong).optional(),
  });
}

/** Type inferred from the auth user schema */
export type AuthUserFormData = z.infer<ReturnType<typeof createAuthUserSchema>>;
