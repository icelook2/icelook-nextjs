import { z } from "zod";

/**
 * Slug schema - URL-friendly identifier.
 */
export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9_-]+$/);

/**
 * Creates translated slug schema.
 */
export function createTranslatedSlugSchema(t: (key: string) => string) {
  return z
    .string()
    .min(3, t("slug_too_short"))
    .max(50, t("slug_too_long"))
    .regex(/^[a-z0-9_-]+$/, t("slug_format"));
}

/**
 * Salon profile schema.
 */
export const salonProfileSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: slugSchema,
  description: z.string().max(1000).trim(),
});

/**
 * Creates translated salon profile schema.
 */
export function createTranslatedSalonProfileSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(2, t("name_too_short"))
      .max(100, t("name_too_long"))
      .trim(),
    slug: createTranslatedSlugSchema(t),
    description: z.string().max(1000, t("description_too_long")).trim(),
  });
}

/**
 * Address schema.
 */
export const addressSchema = z.object({
  address_line1: z.string().min(3).max(200).trim(),
  address_line2: z.string().max(200).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().max(100).trim(),
  postal_code: z.string().max(20).trim(),
  country: z.string().length(2).default("UA"),
});

/**
 * Creates translated address schema.
 */
export function createTranslatedAddressSchema(t: (key: string) => string) {
  return z.object({
    address_line1: z
      .string()
      .min(3, t("address_too_short"))
      .max(200, t("address_too_long"))
      .trim(),
    address_line2: z.string().max(200, t("address_too_long")).trim(),
    city: z
      .string()
      .min(2, t("city_too_short"))
      .max(100, t("city_too_long"))
      .trim(),
    state: z.string().max(100).trim(),
    postal_code: z.string().max(20).trim(),
    country: z.string().length(2),
  });
}

/**
 * Contacts schema.
 */
export const contactsSchema = z.object({
  instagram: z.string().max(100).trim(),
  phone: z.string().max(30).trim(),
  telegram: z.string().max(100).trim(),
  viber: z.string().max(30).trim(),
  whatsapp: z.string().max(30).trim(),
});

/**
 * Creates translated contacts schema.
 */
export function createTranslatedContactsSchema(t: (key: string) => string) {
  return z.object({
    instagram: z.string().max(100, t("contact_too_long")).trim(),
    phone: z.string().max(30, t("contact_too_long")).trim(),
    telegram: z.string().max(100, t("contact_too_long")).trim(),
    viber: z.string().max(30, t("contact_too_long")).trim(),
    whatsapp: z.string().max(30, t("contact_too_long")).trim(),
  });
}

/**
 * Organization profile schema.
 */
export const organizationProfileSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: slugSchema,
  description: z.string().max(1000).trim(),
});

/**
 * Creates translated organization profile schema.
 */
export function createTranslatedOrganizationProfileSchema(
  t: (key: string) => string,
) {
  return z.object({
    name: z
      .string()
      .min(2, t("name_too_short"))
      .max(100, t("name_too_long"))
      .trim(),
    slug: createTranslatedSlugSchema(t),
    description: z.string().max(1000, t("description_too_long")).trim(),
  });
}

/**
 * Complete salon creation schema.
 */
export const createSalonWizardSchema = z.object({
  profile: salonProfileSchema,
  address: addressSchema,
  contacts: contactsSchema,
  organization_id: z.string().uuid().optional(),
});

/**
 * Complete organization creation schema.
 */
export const createOrganizationWizardSchema = z.object({
  profile: organizationProfileSchema,
  contacts: contactsSchema,
});
