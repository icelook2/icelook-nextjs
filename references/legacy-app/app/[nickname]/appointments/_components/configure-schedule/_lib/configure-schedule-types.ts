import type { BulkScheduleResult } from "../../../_actions/working-day.actions";

// ============================================================================
// Types
// ============================================================================

export type ConfigureScheduleStep =
  | "select-days"
  | "configure-hours"
  | "configure-breaks"
  | "confirmation";

export interface WeekdayHours {
  weekday: number; // 0=Mon, 1=Tue, ..., 6=Sun
  weekdayName: string; // e.g., "Friday"
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "18:00"
}

export interface SelectedDateInfo {
  dateStr: string; // YYYY-MM-DD
  date: Date;
  weekday: number; // 0=Mon, ..., 6=Sun
  weekdayName: string;
}

export interface BreakTime {
  id: string;
  startTime: string; // e.g., "13:00"
  endTime: string; // e.g., "14:00"
}

export interface WeekdayBreaks {
  weekday: number; // 0=Mon, ..., 6=Sun
  weekdayName: string;
  breaks: BreakTime[];
}

export interface ConfigureScheduleContextValue {
  // State
  step: ConfigureScheduleStep;
  selectedDates: Set<string>;
  weekdayHours: Map<number, WeekdayHours>;
  weekdayBreaks: Map<number, WeekdayBreaks>;
  dateHours: Map<string, { startTime: string; endTime: string }>;
  isSubmitting: boolean;
  error: string | null;
  result: BulkScheduleResult | null;

  // Navigation
  goToStep: (step: ConfigureScheduleStep) => void;
  goBack: () => void;
  canGoBack: boolean;
  canProceed: boolean;

  // Date selection
  toggleDate: (dateStr: string, date: Date) => void;
  toggleWeekdayColumn: (weekday: number, dates: Date[]) => void;
  toggleWeekRow: (dates: Date[]) => void;

  // Hours configuration
  setWeekdayHours: (
    weekday: number,
    startTime: string,
    endTime: string,
  ) => void;
  setDateHours: (dateStr: string, startTime: string, endTime: string) => void;

  // Breaks configuration
  addBreak: (weekday: number) => void;
  removeBreak: (weekday: number, breakId: string) => void;
  updateBreak: (
    weekday: number,
    breakId: string,
    startTime: string,
    endTime: string,
  ) => void;

  // Submission
  submitSchedule: () => Promise<void>;

  // Reset
  reset: () => void;

  // Derived data
  existingWorkingDates: Set<string>;
  selectedDatesByWeekday: Map<number, SelectedDateInfo[]>;
  totalSelectedDays: number;
}

export interface ConfigureScheduleProviderProps {
  children: React.ReactNode;
  beautyPageId: string;
  nickname: string;
  existingWorkingDates: Set<string>;
  onSuccess?: () => void;
}
