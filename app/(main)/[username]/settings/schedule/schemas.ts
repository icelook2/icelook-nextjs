import { z } from "zod";
import { SLOT_DURATIONS } from "@/lib/schedule/types";

// ============================================================================
// Base Schemas (without translated messages)
// ============================================================================

/**
 * Time format "HH:MM"
 */
export const timeSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/);

/**
 * Date format "YYYY-MM-DD"
 */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Time range (start and end times)
 */
export const timeRangeSchema = z
  .object({
    start: timeSchema,
    end: timeSchema,
  })
  .refine((data) => data.start < data.end, {
    path: ["end"],
  });

/**
 * Slot duration options
 */
export const slotDurationSchema = z
  .enum(SLOT_DURATIONS.map(String) as [string, ...string[]])
  .transform(Number) as z.ZodEffects<
  z.ZodEnum<[string, ...string[]]>,
  number,
  string
>;

/**
 * Day of week (0-6)
 */
export const dayOfWeekSchema = z.number().min(0).max(6);

// ============================================================================
// Schedule Config Schema
// ============================================================================

export const scheduleConfigSchema = z.object({
  timezone: z.string().min(1),
  defaultSlotDuration: z
    .number()
    .refine((val) => SLOT_DURATIONS.includes(val as 5 | 10 | 15 | 30 | 60)),
});

export type ScheduleConfigFormData = z.infer<typeof scheduleConfigSchema>;

// ============================================================================
// Working Day Schema
// ============================================================================

export const workingDaySchema = z
  .object({
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    breaks: z.array(timeRangeSchema).max(10),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine(
    (data) => {
      // Validate all breaks are within working hours
      const workStart = data.startTime;
      const workEnd = data.endTime;
      return data.breaks.every(
        (br) => br.start >= workStart && br.end <= workEnd,
      );
    },
    {
      message: "Breaks must be within working hours",
      path: ["breaks"],
    },
  )
  .refine(
    (data) => {
      // Validate breaks don't overlap
      const breaks = [...data.breaks].sort((a, b) =>
        a.start.localeCompare(b.start),
      );
      for (let i = 0; i < breaks.length - 1; i++) {
        if (breaks[i].end > breaks[i + 1].start) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Breaks must not overlap",
      path: ["breaks"],
    },
  );

export type WorkingDayFormData = z.infer<typeof workingDaySchema>;

// ============================================================================
// Pattern Schemas
// ============================================================================

/**
 * Common working hours used in patterns
 */
export const patternWorkingHoursSchema = z.object({
  start: timeSchema,
  end: timeSchema,
  breaks: z.array(timeRangeSchema).max(10),
});

/**
 * Rotation pattern (e.g., 5 days on, 2 days off)
 */
export const rotationPatternSchema = z.object({
  type: z.literal("rotation"),
  startDate: dateSchema,
  endDate: dateSchema,
  daysOn: z.number().min(1).max(30),
  daysOff: z.number().min(1).max(30),
  workingHours: patternWorkingHoursSchema,
});

export type RotationPatternFormData = z.infer<typeof rotationPatternSchema>;

/**
 * Weekly pattern (specific days of week)
 */
export const weeklyPatternSchema = z.object({
  type: z.literal("weekly"),
  startDate: dateSchema,
  endDate: dateSchema,
  workingDays: z.array(dayOfWeekSchema).min(1).max(7),
  workingHours: patternWorkingHoursSchema,
});

export type WeeklyPatternFormData = z.infer<typeof weeklyPatternSchema>;

/**
 * Bulk pattern (manually selected dates)
 */
export const bulkPatternSchema = z.object({
  type: z.literal("bulk"),
  startDate: dateSchema,
  endDate: dateSchema,
  dates: z.array(dateSchema).min(1),
  workingHours: patternWorkingHoursSchema,
});

export type BulkPatternFormData = z.infer<typeof bulkPatternSchema>;

/**
 * Union of all pattern types
 */
export const schedulePatternSchema = z.discriminatedUnion("type", [
  rotationPatternSchema,
  weeklyPatternSchema,
  bulkPatternSchema,
]);

export type SchedulePatternFormData = z.infer<typeof schedulePatternSchema>;

// ============================================================================
// Translated Schema Factories
// ============================================================================

/**
 * Creates translated time schema with localized error messages.
 */
export function createTranslatedTimeSchema(t: (key: string) => string) {
  return z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, t("time_format_invalid"));
}

/**
 * Creates translated date schema with localized error messages.
 */
export function createTranslatedDateSchema(t: (key: string) => string) {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t("date_format_invalid"));
}

/**
 * Creates translated working day schema with localized error messages.
 */
export function createTranslatedWorkingDaySchema(t: (key: string) => string) {
  const time = createTranslatedTimeSchema(t);
  const date = createTranslatedDateSchema(t);

  const timeRange = z
    .object({
      start: time,
      end: time,
    })
    .refine((data) => data.start < data.end, {
      message: t("time_end_before_start"),
      path: ["end"],
    });

  return z
    .object({
      date: date,
      startTime: time,
      endTime: time,
      breaks: z.array(timeRange).max(10, t("breaks_max_exceeded")),
    })
    .refine((data) => data.startTime < data.endTime, {
      message: t("time_end_before_start"),
      path: ["endTime"],
    })
    .refine(
      (data) => {
        const workStart = data.startTime;
        const workEnd = data.endTime;
        return data.breaks.every(
          (br) => br.start >= workStart && br.end <= workEnd,
        );
      },
      {
        message: t("breaks_outside_hours"),
        path: ["breaks"],
      },
    )
    .refine(
      (data) => {
        const breaks = [...data.breaks].sort((a, b) =>
          a.start.localeCompare(b.start),
        );
        for (let i = 0; i < breaks.length - 1; i++) {
          if (breaks[i].end > breaks[i + 1].start) {
            return false;
          }
        }
        return true;
      },
      {
        message: t("breaks_overlap"),
        path: ["breaks"],
      },
    );
}
