import { z } from "zod";

/**
 * Discount type: percentage off or fixed amount off
 */
export const discountTypeSchema = z.enum(["percentage", "fixed"]);

/**
 * Date string in YYYY-MM-DD format
 */
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");

/**
 * Schema for creating a service bundle
 */
export const createBundleSchema = z
  .object({
    beautyPageId: z.string().uuid(),
    nickname: z.string().min(1),
    name: z.string().min(1, "Bundle name is required").max(100),
    description: z.string().max(500).optional(),
    // New discount system
    discountType: discountTypeSchema.default("percentage"),
    discountValue: z.number().min(1),
    // Legacy field (for backwards compatibility)
    discountPercentage: z.number().min(1).max(90).optional(),
    serviceIds: z
      .array(z.string().uuid())
      .min(2, "Bundle must have at least 2 services"),
    // Optional time limits
    validFrom: dateStringSchema.optional().nullable(),
    validUntil: dateStringSchema.optional().nullable(),
    // Optional quantity limit
    maxQuantity: z.number().int().min(1).optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate discount value based on type
      if (data.discountType === "percentage") {
        return data.discountValue >= 1 && data.discountValue <= 90;
      }
      // For fixed discount, just ensure it's positive
      return data.discountValue > 0;
    },
    {
      message: "Percentage discount must be between 1-90%",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) => {
      // Validate date range if both are provided
      if (data.validFrom && data.validUntil) {
        return data.validFrom <= data.validUntil;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["validUntil"],
    },
  );

export type CreateBundleSchema = z.infer<typeof createBundleSchema>;

/**
 * Schema for updating a service bundle
 */
export const updateBundleSchema = z
  .object({
    bundleId: z.string().uuid(),
    beautyPageId: z.string().uuid(),
    nickname: z.string().min(1),
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    // New discount system
    discountType: discountTypeSchema.optional(),
    discountValue: z.number().min(1).optional(),
    // Legacy field
    discountPercentage: z.number().min(1).max(90).optional(),
    serviceIds: z.array(z.string().uuid()).min(2).optional(),
    isActive: z.boolean().optional(),
    // Optional time limits (null to remove)
    validFrom: dateStringSchema.optional().nullable(),
    validUntil: dateStringSchema.optional().nullable(),
    // Optional quantity limit (null to remove)
    maxQuantity: z.number().int().min(1).optional().nullable(),
  })
  .refine(
    (data) => {
      // Skip validation if discount fields not provided
      if (data.discountType === undefined || data.discountValue === undefined) {
        return true;
      }
      // Validate discount value based on type
      if (data.discountType === "percentage") {
        return data.discountValue >= 1 && data.discountValue <= 90;
      }
      return data.discountValue > 0;
    },
    {
      message: "Percentage discount must be between 1-90%",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) => {
      // Validate date range if both are provided
      if (data.validFrom && data.validUntil) {
        return data.validFrom <= data.validUntil;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["validUntil"],
    },
  );

export type UpdateBundleSchema = z.infer<typeof updateBundleSchema>;

/**
 * Schema for deleting a service bundle
 */
export const deleteBundleSchema = z.object({
  bundleId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
});

export type DeleteBundleSchema = z.infer<typeof deleteBundleSchema>;

/**
 * Schema for toggling bundle active status
 */
export const toggleBundleActiveSchema = z.object({
  bundleId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  isActive: z.boolean(),
});

export type ToggleBundleActiveSchema = z.infer<typeof toggleBundleActiveSchema>;
