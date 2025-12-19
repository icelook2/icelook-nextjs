import { z } from "zod";
import { CURRENCIES, SPECIALTIES } from "./_lib/types";

/**
 * Username schema - alphanumeric, underscores, hyphens only
 */
export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_-]+$/);

/**
 * Display name schema
 */
export const displayNameSchema = z.string().min(2).max(100).trim();

/**
 * Bio schema (optional)
 */
export const bioSchema = z.string().max(500).trim();

/**
 * Specialty schema
 */
export const specialtySchema = z.enum(SPECIALTIES);

/**
 * Currency schema
 */
export const currencySchema = z.enum(CURRENCIES);

/**
 * Profile step schema
 */
export const profileSchema = z.object({
  displayName: displayNameSchema,
  bio: bioSchema,
  specialty: specialtySchema,
  username: usernameSchema,
});

/**
 * Service schema
 */
export const serviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).trim(),
  price: z.number().min(0).max(999999),
  currency: currencySchema,
  durationMinutes: z.number().min(15).max(480),
});

/**
 * Services array schema
 */
export const servicesSchema = z.array(serviceSchema).max(50);

/**
 * Contacts schema (all optional)
 */
export const contactsSchema = z.object({
  instagram: z.string().max(100).trim(),
  phone: z.string().max(30).trim(),
  telegram: z.string().max(100).trim(),
  viber: z.string().max(30).trim(),
  whatsapp: z.string().max(30).trim(),
});

/**
 * Complete wizard data schema
 */
export const specialistWizardSchema = z.object({
  profile: profileSchema,
  services: servicesSchema,
  contacts: contactsSchema,
});

// Translated schema factories

export function createTranslatedProfileSchema(t: (key: string) => string) {
  return z.object({
    displayName: z
      .string()
      .min(2, t("display_name_min"))
      .max(100, t("display_name_max"))
      .trim(),
    bio: z.string().max(500, t("bio_max")).trim(),
    specialty: z.enum(SPECIALTIES, {
      message: t("specialty_required"),
    }),
    username: z
      .string()
      .min(3, t("username_min"))
      .max(30, t("username_max"))
      .regex(/^[a-z0-9_-]+$/, t("username_format")),
  });
}

export function createTranslatedServiceSchema(t: (key: string) => string) {
  return z.object({
    id: z.string(),
    name: z
      .string()
      .min(1, t("service_name_required"))
      .max(100, t("service_name_too_long"))
      .trim(),
    price: z
      .number()
      .min(0, t("price_invalid"))
      .max(999999, t("price_too_high")),
    currency: z.enum(CURRENCIES),
    durationMinutes: z
      .number()
      .min(15, t("duration_too_short"))
      .max(480, t("duration_too_long")),
  });
}

export function createTranslatedContactsSchema(t: (key: string) => string) {
  return z.object({
    instagram: z.string().max(100, t("contact_too_long")).trim(),
    phone: z.string().max(30, t("contact_too_long")).trim(),
    telegram: z.string().max(100, t("contact_too_long")).trim(),
    viber: z.string().max(30, t("contact_too_long")).trim(),
    whatsapp: z.string().max(30, t("contact_too_long")).trim(),
  });
}
