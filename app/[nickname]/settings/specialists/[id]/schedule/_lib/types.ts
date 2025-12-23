import type { Enums, Tables } from "@/lib/supabase/database.types";

// ============================================================================
// Database Types (from Supabase generated types)
// ============================================================================

export type WorkingDay = Tables<"working_days">;
export type WorkingDayBreak = Tables<"working_day_breaks">;
export type Appointment = Tables<"appointments">;
export type AppointmentStatus = Enums<"appointment_status">;

// ============================================================================
// Composite Types
// ============================================================================

/** Working day with its breaks included */
export interface WorkingDayWithBreaks extends WorkingDay {
  breaks: WorkingDayBreak[];
}

/** Schedule data for a date range */
export interface ScheduleData {
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
}

// ============================================================================
// UI Types (not in database)
// ============================================================================

/** Schedule view modes */
export type ViewMode = "week" | "7days" | "3days" | "day";

/** View mode configuration */
export const VIEW_MODE_CONFIG: Record<
  ViewMode,
  { label: string; days: number }
> = {
  week: { label: "Week", days: 7 },
  "7days": { label: "7 Days", days: 7 },
  "3days": { label: "3 Days", days: 3 },
  day: { label: "Day", days: 1 },
};

/** Time slot for grid rendering */
export interface TimeSlot {
  hour: number;
  minute: number;
  label: string; // "8:00" or "8:00 AM"
  topOffset: number; // percentage from grid top (0-100)
}

/** Grid configuration */
export interface GridConfig {
  startHour: number;
  endHour: number;
  pixelsPerHour: number;
  intervalMinutes: number;
}

/** Default grid configuration */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  startHour: 8,
  endHour: 20,
  pixelsPerHour: 60,
  intervalMinutes: 30,
};
