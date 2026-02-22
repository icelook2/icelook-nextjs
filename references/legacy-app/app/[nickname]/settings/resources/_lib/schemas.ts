import { z } from "zod";

/**
 * Common unit options for resources
 */
export const UNIT_OPTIONS = [
  "ml",
  "g",
  "oz",
  "pieces",
  "applications",
  "sheets",
] as const;

/**
 * Schema for creating a new resource
 */
export const createResourceSchema = z.object({
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  name: z.string().min(1, "Resource name is required").max(100),
  unit: z.string().min(1, "Unit is required").max(30),
  costPerUnitCents: z.number().int().min(0).default(0),
  currentStock: z.number().min(0).default(0),
  lowStockThreshold: z.number().min(0).optional().nullable(),
});

export type CreateResourceSchema = z.infer<typeof createResourceSchema>;

/**
 * Schema for updating an existing resource
 */
export const updateResourceSchema = z.object({
  resourceId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  unit: z.string().min(1).max(30).optional(),
  costPerUnitCents: z.number().int().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateResourceSchema = z.infer<typeof updateResourceSchema>;

/**
 * Schema for deleting a resource
 */
export const deleteResourceSchema = z.object({
  resourceId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
});

export type DeleteResourceSchema = z.infer<typeof deleteResourceSchema>;

/**
 * Schema for adjusting stock manually
 */
export const adjustStockSchema = z.object({
  resourceId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  /** Positive to add stock, negative to subtract */
  adjustment: z.number(),
  reason: z.string().max(200).optional(),
});

export type AdjustStockSchema = z.infer<typeof adjustStockSchema>;

/**
 * Schema for toggling resource active status
 */
export const toggleResourceActiveSchema = z.object({
  resourceId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  isActive: z.boolean(),
});

export type ToggleResourceActiveSchema = z.infer<
  typeof toggleResourceActiveSchema
>;

/**
 * Schema for linking a resource to a service
 */
export const linkServiceResourceSchema = z.object({
  serviceId: z.string().uuid(),
  resourceId: z.string().uuid(),
  defaultAmount: z.number().positive("Amount must be positive"),
  nickname: z.string().min(1),
});

export type LinkServiceResourceSchema = z.infer<
  typeof linkServiceResourceSchema
>;

/**
 * Schema for unlinking a resource from a service
 */
export const unlinkServiceResourceSchema = z.object({
  serviceResourceId: z.string().uuid(),
  nickname: z.string().min(1),
});

export type UnlinkServiceResourceSchema = z.infer<
  typeof unlinkServiceResourceSchema
>;

/**
 * Schema for updating a service-resource link
 */
export const updateServiceResourceSchema = z.object({
  serviceResourceId: z.string().uuid(),
  nickname: z.string().min(1),
  defaultAmount: z.number().positive("Amount must be positive"),
});

export type UpdateServiceResourceSchema = z.infer<
  typeof updateServiceResourceSchema
>;
