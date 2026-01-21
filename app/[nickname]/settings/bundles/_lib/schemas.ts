import { z } from "zod";

/**
 * Schema for creating a service bundle
 */
export const createBundleSchema = z.object({
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  name: z.string().min(1, "Bundle name is required").max(100),
  description: z.string().max(500).optional(),
  discountPercentage: z.number().min(1).max(90),
  serviceIds: z
    .array(z.string().uuid())
    .min(2, "Bundle must have at least 2 services"),
});

export type CreateBundleSchema = z.infer<typeof createBundleSchema>;

/**
 * Schema for updating a service bundle
 */
export const updateBundleSchema = z.object({
  bundleId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  discountPercentage: z.number().min(1).max(90).optional(),
  serviceIds: z.array(z.string().uuid()).min(2).optional(),
  isActive: z.boolean().optional(),
});

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
