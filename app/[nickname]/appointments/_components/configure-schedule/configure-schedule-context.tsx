"use client";

/**
 * Configure Schedule Context
 *
 * Manages state for the multi-step schedule configuration dialog.
 * Allows selecting multiple dates and configuring working hours per weekday.
 *
 * Flow: select-days → configure-hours → confirmation
 */

import { format, getDay, parseISO } from "date-fns";
import { createContext, type ReactNode, useContext, useState } from "react";
import {
  type BulkScheduleResult,
  bulkUpdateSchedule,
} from "../../_actions/working-day.actions";

// Simple ID generator (iOS compatible alternative to crypto.randomUUID)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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

interface ConfigureScheduleContextValue {
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

interface ConfigureScheduleProviderProps {
  children: ReactNode;
  beautyPageId: string;
  nickname: string;
  existingWorkingDates: Set<string>;
  onSuccess?: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ConfigureScheduleContext =
  createContext<ConfigureScheduleContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useConfigureSchedule(): ConfigureScheduleContextValue {
  const context = useContext(ConfigureScheduleContext);
  if (!context) {
    throw new Error(
      "useConfigureSchedule must be used within a ConfigureScheduleProvider",
    );
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

const stepOrder: ConfigureScheduleStep[] = [
  "select-days",
  "configure-hours",
  "configure-breaks",
  "confirmation",
];

/**
 * Convert JS getDay() result (0=Sun, 1=Mon) to our weekday system (0=Mon, 6=Sun)
 */
function jsWeekdayToOurs(jsWeekday: number): number {
  return jsWeekday === 0 ? 6 : jsWeekday - 1;
}

export function ConfigureScheduleProvider({
  children,
  beautyPageId,
  nickname,
  existingWorkingDates,
  onSuccess,
}: ConfigureScheduleProviderProps) {
  // State
  const [step, setStep] = useState<ConfigureScheduleStep>("select-days");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [weekdayHours, setWeekdayHoursState] = useState<
    Map<number, WeekdayHours>
  >(new Map());
  const [dateHours, setDateHoursState] = useState<
    Map<string, { startTime: string; endTime: string }>
  >(new Map());
  const [weekdayBreaks, setWeekdayBreaksState] = useState<
    Map<number, WeekdayBreaks>
  >(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkScheduleResult | null>(null);

  // Derived: group selected dates by weekday
  const selectedDatesByWeekday = deriveSelectedDatesByWeekday(selectedDates);
  const totalSelectedDays = selectedDates.size;

  // Navigation
  const goToStep = (newStep: ConfigureScheduleStep) => {
    // When moving to configure-hours, initialize default hours for new weekdays
    if (newStep === "configure-hours") {
      initializeWeekdayHours();
    }
    // When moving to configure-breaks, initialize breaks structure for weekdays
    if (newStep === "configure-breaks") {
      initializeWeekdayBreaks();
    }
    setStep(newStep);
    setError(null);
  };

  const canGoBack = step !== "select-days";

  const goBack = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
      setError(null);
    }
  };

  // Can proceed to next step?
  const canProceed = (() => {
    if (step === "select-days") {
      return selectedDates.size > 0;
    }
    if (step === "configure-hours") {
      // All weekdays must have valid hours (end > start)
      for (const hours of weekdayHours.values()) {
        if (hours.startTime >= hours.endTime) {
          return false;
        }
      }
      return weekdayHours.size > 0;
    }
    // Breaks step is optional - can always proceed
    if (step === "configure-breaks") {
      return true;
    }
    return true;
  })();

  // Initialize hours for weekdays when entering configure-hours step
  const initializeWeekdayHours = () => {
    setWeekdayHoursState((prev) => {
      const newHours = new Map(prev);

      // Add default hours for new weekdays
      for (const [weekday, dates] of selectedDatesByWeekday) {
        if (!newHours.has(weekday) && dates.length > 0) {
          newHours.set(weekday, {
            weekday,
            weekdayName: dates[0].weekdayName,
            startTime: "09:00",
            endTime: "18:00",
          });
        }
      }

      // Remove hours for weekdays no longer in selection
      for (const weekday of newHours.keys()) {
        if (!selectedDatesByWeekday.has(weekday)) {
          newHours.delete(weekday);
        }
      }

      return newHours;
    });
  };

  // Initialize breaks for weekdays when entering configure-breaks step
  const initializeWeekdayBreaks = () => {
    setWeekdayBreaksState((prev) => {
      const newBreaks = new Map(prev);

      // Add empty breaks for new weekdays
      for (const [weekday, dates] of selectedDatesByWeekday) {
        if (!newBreaks.has(weekday) && dates.length > 0) {
          newBreaks.set(weekday, {
            weekday,
            weekdayName: dates[0].weekdayName,
            breaks: [],
          });
        }
      }

      // Remove breaks for weekdays no longer in selection
      for (const weekday of newBreaks.keys()) {
        if (!selectedDatesByWeekday.has(weekday)) {
          newBreaks.delete(weekday);
        }
      }

      return newBreaks;
    });
  };

  // Date selection
  const toggleDate = (dateStr: string, _date: Date) => {
    // Cannot toggle existing working days
    if (existingWorkingDates.has(dateStr)) {
      return;
    }

    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const toggleWeekdayColumn = (_weekday: number, dates: Date[]) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      const dateStrs = dates
        .map((d) => format(d, "yyyy-MM-dd"))
        .filter((str) => !existingWorkingDates.has(str)); // Exclude existing working days

      if (dateStrs.length === 0) {
        return prev;
      }

      // Check if all dates in column are already selected
      const allSelected = dateStrs.every((str) => next.has(str));

      if (allSelected) {
        // Deselect all
        for (const str of dateStrs) {
          next.delete(str);
        }
      } else {
        // Select all
        for (const str of dateStrs) {
          next.add(str);
        }
      }

      return next;
    });
  };

  const toggleWeekRow = (dates: Date[]) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      const dateStrs = dates
        .map((d) => format(d, "yyyy-MM-dd"))
        .filter((str) => !existingWorkingDates.has(str)); // Exclude existing working days

      if (dateStrs.length === 0) {
        return prev;
      }

      // Check if all dates in week row are already selected
      const allSelected = dateStrs.every((str) => next.has(str));

      if (allSelected) {
        // Deselect all
        for (const str of dateStrs) {
          next.delete(str);
        }
      } else {
        // Select all
        for (const str of dateStrs) {
          next.add(str);
        }
      }

      return next;
    });
  };

  // Hours configuration
  const setWeekdayHours = (
    weekday: number,
    startTime: string,
    endTime: string,
  ) => {
    setWeekdayHoursState((prev) => {
      const next = new Map(prev);
      const existing = next.get(weekday);
      if (existing) {
        next.set(weekday, { ...existing, startTime, endTime });
      }
      return next;
    });
  };

  const setDateHours = (
    dateStr: string,
    startTime: string,
    endTime: string,
  ) => {
    setDateHoursState((prev) => {
      const next = new Map(prev);
      next.set(dateStr, { startTime, endTime });
      return next;
    });
  };

  // Breaks configuration
  const addBreak = (weekday: number) => {
    setWeekdayBreaksState((prev) => {
      const next = new Map(prev);
      const existing = next.get(weekday);
      if (existing) {
        const newBreak: BreakTime = {
          id: generateId(),
          startTime: "13:00",
          endTime: "14:00",
        };
        next.set(weekday, {
          ...existing,
          breaks: [...existing.breaks, newBreak],
        });
      }
      return next;
    });
  };

  const removeBreak = (weekday: number, breakId: string) => {
    setWeekdayBreaksState((prev) => {
      const next = new Map(prev);
      const existing = next.get(weekday);
      if (existing) {
        next.set(weekday, {
          ...existing,
          breaks: existing.breaks.filter((b) => b.id !== breakId),
        });
      }
      return next;
    });
  };

  const updateBreak = (
    weekday: number,
    breakId: string,
    startTime: string,
    endTime: string,
  ) => {
    setWeekdayBreaksState((prev) => {
      const next = new Map(prev);
      const existing = next.get(weekday);
      if (existing) {
        next.set(weekday, {
          ...existing,
          breaks: existing.breaks.map((b) =>
            b.id === breakId ? { ...b, startTime, endTime } : b,
          ),
        });
      }
      return next;
    });
  };

  // Submit schedule
  const submitSchedule = async () => {
    setIsSubmitting(true);
    setError(null);

    // Build create payload with breaks
    const toCreate: Array<{
      date: string;
      startTime: string;
      endTime: string;
      breaks?: Array<{ startTime: string; endTime: string }>;
    }> = [];

    for (const dateStr of selectedDates) {
      const date = parseISO(dateStr);
      const weekday = jsWeekdayToOurs(getDay(date));

      // Get hours (date-specific or weekday)
      const dateSpecific = dateHours.get(dateStr);
      const hours = dateSpecific || weekdayHours.get(weekday);

      // Get breaks for this weekday
      const breaksData = weekdayBreaks.get(weekday);
      const breaks =
        breaksData?.breaks.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
        })) || [];

      if (hours) {
        toCreate.push({
          date: dateStr,
          startTime: dateSpecific?.startTime || hours.startTime,
          endTime: dateSpecific?.endTime || hours.endTime,
          breaks: breaks.length > 0 ? breaks : undefined,
        });
      }
    }

    const response = await bulkUpdateSchedule({
      beautyPageId,
      nickname,
      toCreate,
      toUpdate: [],
      toDelete: [],
    });

    if (response.success) {
      if (response.data) {
        setResult(response.data);
      }
      onSuccess?.();
    } else {
      setError(response.error);
    }

    setIsSubmitting(false);
  };

  // Reset
  const reset = () => {
    setStep("select-days");
    setSelectedDates(new Set());
    setWeekdayHoursState(new Map());
    setWeekdayBreaksState(new Map());
    setDateHoursState(new Map());
    setIsSubmitting(false);
    setError(null);
    setResult(null);
  };

  // Context value
  const value: ConfigureScheduleContextValue = {
    // State
    step,
    selectedDates,
    weekdayHours,
    weekdayBreaks,
    dateHours,
    isSubmitting,
    error,
    result,

    // Navigation
    goToStep,
    goBack,
    canGoBack,
    canProceed,

    // Date selection
    toggleDate,
    toggleWeekdayColumn,
    toggleWeekRow,

    // Hours configuration
    setWeekdayHours,
    setDateHours,

    // Breaks configuration
    addBreak,
    removeBreak,
    updateBreak,

    // Submission
    submitSchedule,

    // Reset
    reset,

    // Derived
    existingWorkingDates,
    selectedDatesByWeekday,
    totalSelectedDays,
  };

  return (
    <ConfigureScheduleContext.Provider value={value}>
      {children}
    </ConfigureScheduleContext.Provider>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function deriveSelectedDatesByWeekday(
  selectedDates: Set<string>,
): Map<number, SelectedDateInfo[]> {
  const grouped = new Map<number, SelectedDateInfo[]>();

  for (const dateStr of selectedDates) {
    const date = parseISO(dateStr);
    const jsWeekday = getDay(date); // 0=Sun, 1=Mon, ...
    const weekday = jsWeekdayToOurs(jsWeekday); // 0=Mon, ..., 6=Sun

    if (!grouped.has(weekday)) {
      grouped.set(weekday, []);
    }

    grouped.get(weekday)?.push({
      dateStr,
      date,
      weekday,
      weekdayName: format(date, "EEEE"), // Full day name
    });
  }

  // Sort dates within each weekday
  for (const dates of grouped.values()) {
    dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return grouped;
}
