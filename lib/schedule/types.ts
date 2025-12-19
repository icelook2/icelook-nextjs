/**
 * Schedule system types matching the database schema.
 */

// ============================================================================
// Constants as Types
// ============================================================================

export const SLOT_DURATIONS = [5, 10, 15, 30, 60] as const;
export type SlotDuration = (typeof SLOT_DURATIONS)[number];

export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_OF_WEEK_LABELS = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
} as const;

export const PATTERN_TYPES = ["rotation", "weekly", "bulk"] as const;
export type PatternType = (typeof PATTERN_TYPES)[number];

// ============================================================================
// Database Row Types
// ============================================================================

/**
 * Specialist schedule configuration (1:1 with specialist).
 */
export interface ScheduleConfig {
  specialist_id: string;
  timezone: string;
  default_slot_duration: SlotDuration;
  created_at: string;
  updated_at: string;
}

/**
 * Individual working day record.
 */
export interface WorkingDay {
  id: string;
  specialist_id: string;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  created_at: string;
  updated_at: string;
}

/**
 * Break within a working day.
 */
export interface WorkingDayBreak {
  id: string;
  working_day_id: string;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  created_at: string;
}

/**
 * Working day with its breaks included.
 */
export interface WorkingDayWithBreaks extends WorkingDay {
  working_day_breaks: WorkingDayBreak[];
}

// ============================================================================
// Form/Input Types
// ============================================================================

/**
 * Input for creating/updating schedule config.
 */
export interface ScheduleConfigInput {
  timezone: string;
  default_slot_duration: SlotDuration;
}

/**
 * Time range in "HH:MM" format.
 */
export interface TimeRange {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

/**
 * Input for creating/updating a working day.
 */
export interface WorkingDayInput {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  breaks: TimeRange[];
}

// ============================================================================
// Pattern Types
// ============================================================================

/**
 * Common fields for all patterns.
 */
interface BasePattern {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  workingHours: {
    start: string; // "HH:MM"
    end: string; // "HH:MM"
    breaks: TimeRange[];
  };
}

/**
 * Rotation pattern (e.g., 5 days on, 2 days off).
 */
export interface RotationPattern extends BasePattern {
  type: "rotation";
  daysOn: number;
  daysOff: number;
}

/**
 * Weekly template (e.g., Mon-Fri with specific hours).
 */
export interface WeeklyPattern extends BasePattern {
  type: "weekly";
  /** Days of week that are working days (0=Sunday, 6=Saturday) */
  workingDays: DayOfWeek[];
}

/**
 * Bulk selection (specific dates selected manually).
 */
export interface BulkPattern extends BasePattern {
  type: "bulk";
  /** Specific dates selected */
  dates: string[]; // Array of "YYYY-MM-DD"
}

export type SchedulePattern = RotationPattern | WeeklyPattern | BulkPattern;

// ============================================================================
// Time Slot Types (for display/booking)
// ============================================================================

/**
 * A single time slot for display in timeline or booking.
 */
export interface TimeSlot {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  available: boolean;
  blockedReason?: "break" | "booked";
}

/**
 * Generated working day for pattern preview.
 */
export interface GeneratedWorkingDay {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  breaks: TimeRange[];
}
