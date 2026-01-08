import { z } from "zod";

/**
 * Schema for creating a special offer
 */
export const createSpecialOfferSchema = z.object({
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  discountPercentage: z.number().min(0).max(100),
});

export type CreateSpecialOfferSchema = z.infer<typeof createSpecialOfferSchema>;

/**
 * Schema for deleting a special offer
 */
export const deleteSpecialOfferSchema = z.object({
  id: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
});

export type DeleteSpecialOfferSchema = z.infer<typeof deleteSpecialOfferSchema>;
