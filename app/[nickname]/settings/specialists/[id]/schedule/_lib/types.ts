// Schedule view modes
export type ViewMode = "week" | "7days" | "3days" | "day";

// View mode configuration
export const VIEW_MODE_CONFIG: Record<
  ViewMode,
  { label: string; days: number }
> = {
  week: { label: "Week", days: 7 },
  "7days": { label: "7 Days", days: 7 },
  "3days": { label: "3 Days", days: 3 },
  day: { label: "Day", days: 1 },
};

// Working day (from database)
export interface WorkingDay {
  id: string;
  specialist_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  created_at: string;
  updated_at: string;
}

// Break (from database)
export interface WorkingDayBreak {
  id: string;
  working_day_id: string;
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  created_at: string;
}

// Appointment status
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

// Appointment (from database)
export interface Appointment {
  id: string;
  specialist_id: string | null;
  service_id: string | null;
  client_id: string | null;
  specialist_username: string;
  specialist_display_name: string;
  service_name: string;
  service_price: number;
  service_currency: string;
  service_duration_minutes: number;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  timezone: string;
  status: AppointmentStatus;
  client_notes: string | null;
  specialist_notes: string | null;
  total_duration_minutes: number | null;
  total_price: number | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

// Schedule config (from database)
export interface ScheduleConfig {
  specialist_id: string;
  timezone: string;
  default_slot_duration: number; // minutes
  created_at: string;
  updated_at: string;
}

// Time slot for grid rendering
export interface TimeSlot {
  hour: number;
  minute: number;
  label: string; // "8:00" or "8:00 AM"
  topOffset: number; // percentage from grid top (0-100)
}

// Working day with its breaks
export interface WorkingDayWithBreaks extends WorkingDay {
  breaks: WorkingDayBreak[];
}

// Schedule data for a date range
export interface ScheduleData {
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
}

// Grid configuration
export interface GridConfig {
  startHour: number;
  endHour: number;
  pixelsPerHour: number;
  intervalMinutes: number;
}

// Default grid configuration
export const DEFAULT_GRID_CONFIG: GridConfig = {
  startHour: 8,
  endHour: 20,
  pixelsPerHour: 60,
  intervalMinutes: 30,
};
