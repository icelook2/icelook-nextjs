import { z } from "zod";

/**
 * Promotion types matching database enum
 */
export const promotionTypes = ["sale", "slot", "time"] as const;
export type PromotionTypeValue = (typeof promotionTypes)[number];

/**
 * Time string format: HH:MM
 */
const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format");

/**
 * Date string format: YYYY-MM-DD
 */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

/**
 * Schema for creating a promotion
 * Uses refinements for type-specific validation
 */
export const createPromotionSchema = z
  .object({
    beautyPageId: z.string().uuid(),
    nickname: z.string().min(1),
    serviceId: z.string().uuid(),
    type: z.enum(promotionTypes),
    discountPercentage: z
      .number()
      .min(1, "Discount must be at least 1%")
      .max(50, "Discount cannot exceed 50%"),
    // Sale fields
    startsAt: dateString.nullable().optional(),
    endsAt: dateString.nullable().optional(),
    // Slot fields
    slotDate: dateString.nullable().optional(),
    slotStartTime: timeString.nullable().optional(),
    slotEndTime: timeString.nullable().optional(),
    // Time fields
    recurringStartTime: timeString.nullable().optional(),
    recurringDays: z.array(z.number().min(0).max(6)).nullable().optional(),
    recurringValidUntil: dateString.nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "sale") {
        return data.endsAt !== null && data.endsAt !== undefined;
      }
      return true;
    },
    {
      message: "Sale promotions must have an end date",
      path: ["endsAt"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "slot") {
        return (
          data.slotDate !== null &&
          data.slotDate !== undefined &&
          data.slotStartTime !== null &&
          data.slotStartTime !== undefined &&
          data.slotEndTime !== null &&
          data.slotEndTime !== undefined
        );
      }
      return true;
    },
    {
      message: "Slot promotions must have date and time",
      path: ["slotDate"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "time") {
        return (
          data.recurringStartTime !== null &&
          data.recurringStartTime !== undefined
        );
      }
      return true;
    },
    {
      message: "Time promotions must have a start time",
      path: ["recurringStartTime"],
    },
  );

export type CreatePromotionSchema = z.infer<typeof createPromotionSchema>;

/**
 * Schema for deleting a promotion
 */
export const deletePromotionSchema = z.object({
  promotionId: z.string().uuid(),
  beautyPageId: z.string().uuid(),
  nickname: z.string().min(1),
});

export type DeletePromotionSchema = z.infer<typeof deletePromotionSchema>;
