import { z } from "zod";

/**
 * Slug validation - URL-friendly identifier.
 * Format: lowercase alphanumeric with hyphens and underscores, 3-50 chars.
 */
export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9_-]+$/);

/**
 * Creates translated slug schema with localized error messages.
 */
export function createTranslatedSlugSchema(t: (key: string) => string) {
  return z
    .string()
    .min(3, t("slug_too_short"))
    .max(50, t("slug_too_long"))
    .regex(/^[a-z0-9_-]+$/, t("slug_format"));
}

/**
 * Business name validation.
 */
export const businessNameSchema = z.string().min(2).max(100).trim();

/**
 * Creates translated business name schema.
 */
export function createTranslatedBusinessNameSchema(t: (key: string) => string) {
  return z
    .string()
    .min(2, t("name_too_short"))
    .max(100, t("name_too_long"))
    .trim();
}

/**
 * Business description validation.
 */
export const businessDescriptionSchema = z.string().max(1000).trim();

/**
 * Creates translated description schema.
 */
export function createTranslatedDescriptionSchema(t: (key: string) => string) {
  return z.string().max(1000, t("description_too_long")).trim();
}

/**
 * Address line validation.
 */
export const addressLineSchema = z.string().min(3).max(200).trim();

/**
 * Creates translated address schema.
 */
export function createTranslatedAddressSchema(t: (key: string) => string) {
  return z
    .string()
    .min(3, t("address_too_short"))
    .max(200, t("address_too_long"))
    .trim();
}

/**
 * City validation.
 */
export const citySchema = z.string().min(2).max(100).trim();

/**
 * Creates translated city schema.
 */
export function createTranslatedCitySchema(t: (key: string) => string) {
  return z
    .string()
    .min(2, t("city_too_short"))
    .max(100, t("city_too_long"))
    .trim();
}

/**
 * Country code validation (ISO 3166-1 alpha-2).
 */
export const countrySchema = z.string().length(2).default("UA");

/**
 * Contact field validation (optional, max length).
 */
export const contactFieldSchema = z.string().max(100).trim();

/**
 * Creates translated contact field schema.
 */
export function createTranslatedContactFieldSchema(t: (key: string) => string) {
  return z.string().max(100, t("contact_too_long")).trim();
}

/**
 * Contacts schema - all fields optional.
 */
export const contactsSchema = z.object({
  instagram: contactFieldSchema,
  phone: contactFieldSchema,
  telegram: contactFieldSchema,
  viber: contactFieldSchema,
  whatsapp: contactFieldSchema,
});

/**
 * Creates translated contacts schema.
 */
export function createTranslatedContactsSchema(t: (key: string) => string) {
  const field = createTranslatedContactFieldSchema(t);
  return z.object({
    instagram: field,
    phone: field,
    telegram: field,
    viber: field,
    whatsapp: field,
  });
}

/**
 * Salon profile schema for creation/editing.
 */
export const salonProfileSchema = z.object({
  name: businessNameSchema,
  slug: slugSchema,
  description: businessDescriptionSchema,
  address_line1: addressLineSchema,
  address_line2: z.string().max(200).trim(),
  city: citySchema,
  state: z.string().max(100).trim(),
  postal_code: z.string().max(20).trim(),
  country: countrySchema,
});

/**
 * Creates translated salon profile schema.
 */
export function createTranslatedSalonProfileSchema(t: (key: string) => string) {
  return z.object({
    name: createTranslatedBusinessNameSchema(t),
    slug: createTranslatedSlugSchema(t),
    description: createTranslatedDescriptionSchema(t),
    address_line1: createTranslatedAddressSchema(t),
    address_line2: z.string().max(200, t("address_too_long")).trim(),
    city: createTranslatedCitySchema(t),
    state: z.string().max(100).trim(),
    postal_code: z.string().max(20).trim(),
    country: countrySchema,
  });
}

/**
 * Organization profile schema for creation/editing.
 */
export const organizationProfileSchema = z.object({
  name: businessNameSchema,
  slug: slugSchema,
  description: businessDescriptionSchema,
});

/**
 * Creates translated organization profile schema.
 */
export function createTranslatedOrganizationProfileSchema(
  t: (key: string) => string,
) {
  return z.object({
    name: createTranslatedBusinessNameSchema(t),
    slug: createTranslatedSlugSchema(t),
    description: createTranslatedDescriptionSchema(t),
  });
}

/**
 * Complete salon creation schema (profile + contacts).
 */
export const createSalonSchema = z.object({
  profile: salonProfileSchema,
  contacts: contactsSchema,
  organization_id: z.string().uuid().optional(),
});

/**
 * Complete organization creation schema (profile + contacts).
 */
export const createOrganizationSchema = z.object({
  profile: organizationProfileSchema,
  contacts: contactsSchema,
});

export type SalonProfileData = z.infer<typeof salonProfileSchema>;
export type OrganizationProfileData = z.infer<typeof organizationProfileSchema>;
export type ContactsData = z.infer<typeof contactsSchema>;
export type CreateSalonData = z.infer<typeof createSalonSchema>;
export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;
