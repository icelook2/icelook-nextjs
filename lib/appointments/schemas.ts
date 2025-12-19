/**
 * Appointment booking validation schemas.
 */

import { z } from "zod";

// ============================================================================
// Base Schemas (no translations - for server-side validation)
// ============================================================================

/**
 * Phone number schema (basic validation).
 */
export const phoneSchema = z
  .string()
  .min(10)
  .max(30)
  .regex(/^[+\d\s()\-]+$/);

/**
 * Guest info schema (for non-logged-in users).
 */
export const guestInfoSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  phone: phoneSchema,
});

/**
 * Client notes schema.
 */
export const clientNotesSchema = z.string().max(500).optional();

/**
 * Complete booking schema (for server action validation).
 */
export const createAppointmentSchema = z.object({
  specialist_id: z.string().uuid(),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // "YYYY-MM-DD"
  start_time: z.string().regex(/^\d{2}:\d{2}$/), // "HH:MM"
  client_notes: clientNotesSchema,

  // Guest fields (conditional - required if client_id is null)
  guest_name: z.string().min(2).max(100).optional(),
  guest_phone: phoneSchema.optional(),
});

/**
 * Multi-service booking schema (for combined appointments).
 */
export const createMultiServiceAppointmentSchema = z.object({
  specialist_id: z.string().uuid(),
  service_ids: z.array(z.string().uuid()).min(1).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // "YYYY-MM-DD"
  start_time: z.string().regex(/^\d{2}:\d{2}$/), // "HH:MM"
  client_notes: clientNotesSchema,

  // Guest fields (conditional - required if client_id is null)
  guest_name: z.string().min(2).max(100).optional(),
  guest_phone: phoneSchema.optional(),
});

/**
 * Booking settings schema.
 */
export const bookingSettingsSchema = z.object({
  auto_confirm: z.boolean(),
  min_booking_notice_hours: z.number().int().min(0).max(168), // 0-7 days
  max_booking_days_ahead: z.number().int().min(1).max(365), // 1-365 days
  allow_client_cancellation: z.boolean(),
  cancellation_notice_hours: z.number().int().min(0).max(168), // 0-7 days
});

// ============================================================================
// Translated Schema Factories (for client-side with localized messages)
// ============================================================================

/**
 * Creates translated phone schema.
 */
export function createTranslatedPhoneSchema(t: (key: string) => string) {
  return z
    .string()
    .min(10, t("phone_too_short"))
    .max(30, t("phone_too_long"))
    .regex(/^[+\d\s()\-]+$/, t("phone_invalid_format"));
}

/**
 * Creates translated guest info schema.
 */
export function createTranslatedGuestInfoSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(2, t("name_too_short"))
      .max(100, t("name_too_long"))
      .trim(),
    phone: createTranslatedPhoneSchema(t),
  });
}

/**
 * Creates translated client notes schema.
 */
export function createTranslatedClientNotesSchema(t: (key: string) => string) {
  return z.string().max(500, t("notes_too_long")).optional();
}
