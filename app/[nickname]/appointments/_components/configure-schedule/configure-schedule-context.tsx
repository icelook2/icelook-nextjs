"use client";

/**
 * Configure Schedule Context
 *
 * Manages state for the multi-step schedule configuration dialog.
 * Allows selecting multiple dates and configuring working hours per weekday.
 *
 * Flow: select-days → configure-hours → configure-breaks → confirmation
 */

import { format, getDay, parseISO } from "date-fns";
import { createContext, useContext, useState } from "react";
import {
  type BulkScheduleResult,
  bulkUpdateSchedule,
} from "../../_actions/working-day.actions";
import {
  deriveSelectedDatesByWeekday,
  generateId,
  jsWeekdayToOurs,
  STEP_ORDER,
} from "./_lib/configure-schedule-helpers";
import type {
  BreakTime,
  ConfigureScheduleContextValue,
  ConfigureScheduleProviderProps,
  ConfigureScheduleStep,
  WeekdayBreaks,
  WeekdayHours,
} from "./_lib/configure-schedule-types";

// Re-export types for consumers
export type {
  BreakTime,
  ConfigureScheduleStep,
  SelectedDateInfo,
  WeekdayBreaks,
  WeekdayHours,
} from "./_lib/configure-schedule-types";

// ============================================================================
// Context & Hook
// ============================================================================

const ConfigureScheduleContext =
  createContext<ConfigureScheduleContextValue | null>(null);

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

  // Derived values
  const selectedDatesByWeekday = deriveSelectedDatesByWeekday(selectedDates);
  const totalSelectedDays = selectedDates.size;

  // Navigation
  const goToStep = (newStep: ConfigureScheduleStep) => {
    if (newStep === "configure-hours") {
      initializeWeekdayHours();
    }
    if (newStep === "configure-breaks") {
      initializeWeekdayBreaks();
    }
    setStep(newStep);
    setError(null);
  };

  const canGoBack = step !== "select-days";

  const goBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
      setError(null);
    }
  };

  const canProceed = (() => {
    if (step === "select-days") {
      return selectedDates.size > 0;
    }
    if (step === "configure-hours") {
      for (const hours of weekdayHours.values()) {
        if (hours.startTime >= hours.endTime) {
          return false;
        }
      }
      return weekdayHours.size > 0;
    }
    return true;
  })();

  // Initialize hours for weekdays
  const initializeWeekdayHours = () => {
    setWeekdayHoursState((prev) => {
      const newHours = new Map(prev);
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
      for (const weekday of newHours.keys()) {
        if (!selectedDatesByWeekday.has(weekday)) {
          newHours.delete(weekday);
        }
      }
      return newHours;
    });
  };

  // Initialize breaks for weekdays
  const initializeWeekdayBreaks = () => {
    setWeekdayBreaksState((prev) => {
      const newBreaks = new Map(prev);
      for (const [weekday, dates] of selectedDatesByWeekday) {
        if (!newBreaks.has(weekday) && dates.length > 0) {
          newBreaks.set(weekday, {
            weekday,
            weekdayName: dates[0].weekdayName,
            breaks: [],
          });
        }
      }
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
        .filter((str) => !existingWorkingDates.has(str));

      if (dateStrs.length === 0) {
        return prev;
      }

      const allSelected = dateStrs.every((str) => next.has(str));
      if (allSelected) {
        for (const str of dateStrs) {
          next.delete(str);
        }
      } else {
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
        .filter((str) => !existingWorkingDates.has(str));

      if (dateStrs.length === 0) {
        return prev;
      }

      const allSelected = dateStrs.every((str) => next.has(str));
      if (allSelected) {
        for (const str of dateStrs) {
          next.delete(str);
        }
      } else {
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

    const toCreate: Array<{
      date: string;
      startTime: string;
      endTime: string;
      breaks?: Array<{ startTime: string; endTime: string }>;
    }> = [];

    for (const dateStr of selectedDates) {
      const date = parseISO(dateStr);
      const weekday = jsWeekdayToOurs(getDay(date));

      const dateSpecific = dateHours.get(dateStr);
      const hours = dateSpecific || weekdayHours.get(weekday);

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
    step,
    selectedDates,
    weekdayHours,
    weekdayBreaks,
    dateHours,
    isSubmitting,
    error,
    result,
    goToStep,
    goBack,
    canGoBack,
    canProceed,
    toggleDate,
    toggleWeekdayColumn,
    toggleWeekRow,
    setWeekdayHours,
    setDateHours,
    addBreak,
    removeBreak,
    updateBreak,
    submitSchedule,
    reset,
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
