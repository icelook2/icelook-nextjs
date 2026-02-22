import { z } from "zod";
import {
  beautyPageNameSchema,
  beautyPageSlugSchema,
  RESERVED_SLUGS,
} from "@/lib/validation/schemas";

/**
 * Schema for basics (name and nickname)
 */
export const basicsSchema = z.object({
  name: beautyPageNameSchema,
  nickname: beautyPageSlugSchema.refine(
    (slug) => !RESERVED_SLUGS.includes(slug as never),
    { message: "reserved" },
  ),
});

export type BasicsFormData = z.infer<typeof basicsSchema>;

/**
 * Schema for service data sent to server (prices in cents)
 */
export const serverServiceSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  priceCents: z.number().min(100).max(100_000_000), // Price in cents
  durationMinutes: z.number().min(5),
});

/**
 * Schema for break time configuration
 */
export const breakTimeSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

/**
 * Schema for first working day configuration
 */
export const firstWorkingDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakTime: breakTimeSchema.optional(),
});

/**
 * Full schema for creating beauty page with optional services and first working day
 * Used by the server action
 */
export const createBeautyPageFlowSchema = z.object({
  // Required
  name: beautyPageNameSchema,
  nickname: beautyPageSlugSchema,

  // Optional - array of services
  services: z.array(serverServiceSchema),

  // Optional - first working day configuration
  firstWorkingDay: firstWorkingDaySchema.nullable(),
});

export type CreateBeautyPageFlowInput = z.infer<
  typeof createBeautyPageFlowSchema
>;

/**
 * Creates translated basics schema with localized error messages
 * @deprecated Use createTranslatedNameNicknameSchema instead
 */
export function createTranslatedBasicsSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(2, t("beauty_page_name_too_short"))
      .max(100, t("beauty_page_name_too_long"))
      .trim(),
    nickname: z
      .string()
      .min(3, t("beauty_page_slug_too_short"))
      .max(30, t("beauty_page_slug_too_long"))
      .regex(
        /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
        t("beauty_page_slug_invalid_format"),
      )
      .refine((slug) => !RESERVED_SLUGS.includes(slug as never), {
        message: t("beauty_page_slug_reserved"),
      }),
  });
}

/**
 * Schema for Step 2: Name & Nickname
 */
export const nameNicknameSchema = z.object({
  name: beautyPageNameSchema,
  nickname: beautyPageSlugSchema.refine(
    (slug) => !RESERVED_SLUGS.includes(slug as never),
    { message: "reserved" },
  ),
});

export type NameNicknameFormData = z.infer<typeof nameNicknameSchema>;

/**
 * Creates translated name-nickname schema with localized error messages
 */
export function createTranslatedNameNicknameSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(2, t("beauty_page_name_too_short"))
      .max(100, t("beauty_page_name_too_long"))
      .trim(),
    nickname: z
      .string()
      .min(3, t("beauty_page_slug_too_short"))
      .max(30, t("beauty_page_slug_too_long"))
      .regex(
        /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
        t("beauty_page_slug_invalid_format"),
      )
      .refine((slug) => !RESERVED_SLUGS.includes(slug as never), {
        message: t("beauty_page_slug_reserved"),
      }),
  });
}

/**
 * Creates translated service schema with localized error messages
 */
export function createTranslatedServiceSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(1, t("service_name_required"))
      .max(100, t("service_name_too_long"))
      .trim(),
    price: z
      .number()
      .min(1, t("service_price_required"))
      .max(1_000_000, t("service_price_too_high")),
    durationMinutes: z.number().min(5, t("service_duration_required")),
  });
}
