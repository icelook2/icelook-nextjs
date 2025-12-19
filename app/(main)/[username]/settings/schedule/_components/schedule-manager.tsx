"use client";

import { useCallback, useState, useTransition } from "react";
import { getMonthDateRange } from "@/lib/schedule/pattern-generators";
import type {
  ScheduleConfig,
  WorkingDayWithBreaks,
} from "@/lib/schedule/types";
import { getWorkingDays } from "../_actions/working-days.action";
import { DayDetail } from "./day-detail";
import { MonthCalendar } from "./month-calendar";
import { ScheduleToolbar } from "./schedule-toolbar";

interface ScheduleManagerProps {
  specialistId: string;
  initialConfig: ScheduleConfig;
  initialWorkingDays: WorkingDayWithBreaks[];
  initialYear: number;
  initialMonth: number;
}

export function ScheduleManager({
  specialistId,
  initialConfig,
  initialWorkingDays,
  initialYear,
  initialMonth,
}: ScheduleManagerProps) {
  const [isPending, startTransition] = useTransition();

  // Current month state
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Selected date
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Working days cache (Map<"YYYY-MM", WorkingDayWithBreaks[]>)
  const [workingDaysCache, setWorkingDaysCache] = useState<
    Map<string, WorkingDayWithBreaks[]>
  >(() => {
    const cache = new Map<string, WorkingDayWithBreaks[]>();
    const key = `${initialYear}-${String(initialMonth).padStart(2, "0")}`;
    cache.set(key, initialWorkingDays);
    return cache;
  });

  // Config state
  const [config, setConfig] = useState(initialConfig);

  // Get working days for current month
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const currentMonthWorkingDays = workingDaysCache.get(monthKey) ?? [];

  // Create a map for quick lookup
  const workingDaysMap = new Map(
    currentMonthWorkingDays.map((wd) => [wd.date, wd]),
  );

  // Load working days for a month
  const loadMonthData = useCallback(
    async (targetYear: number, targetMonth: number) => {
      const key = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;

      // Check cache first
      if (workingDaysCache.has(key)) {
        return;
      }

      const { startDate, endDate } = getMonthDateRange(targetYear, targetMonth);

      startTransition(async () => {
        const result = await getWorkingDays(specialistId, startDate, endDate);

        if (result.success && result.data) {
          setWorkingDaysCache((prev) => {
            const newCache = new Map(prev);
            newCache.set(key, result.data);
            return newCache;
          });
        }
      });
    },
    [specialistId, workingDaysCache],
  );

  // Handle month navigation
  const handleMonthChange = useCallback(
    (newYear: number, newMonth: number) => {
      setYear(newYear);
      setMonth(newMonth);
      loadMonthData(newYear, newMonth);
    },
    [loadMonthData],
  );

  // Handle date selection
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  // Refresh current month data
  const refreshMonth = useCallback(async () => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const { startDate, endDate } = getMonthDateRange(year, month);

    const result = await getWorkingDays(specialistId, startDate, endDate);

    if (result.success && result.data) {
      setWorkingDaysCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(key, result.data);
        return newCache;
      });
    }
  }, [specialistId, year, month]);

  // Get selected working day
  const selectedWorkingDay = selectedDate
    ? workingDaysMap.get(selectedDate)
    : null;

  return (
    <div className="space-y-6">
      <ScheduleToolbar
        specialistId={specialistId}
        config={config}
        onConfigChange={setConfig}
        onPatternGenerated={refreshMonth}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <MonthCalendar
          year={year}
          month={month}
          workingDaysMap={workingDaysMap}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          isLoading={isPending}
        />

        <DayDetail
          specialistId={specialistId}
          date={selectedDate}
          workingDay={selectedWorkingDay ?? null}
          slotDuration={config.default_slot_duration}
          onUpdate={refreshMonth}
        />
      </div>
    </div>
  );
}
