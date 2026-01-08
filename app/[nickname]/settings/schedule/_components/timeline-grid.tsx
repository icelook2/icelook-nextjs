"use client";

import { cn } from "@/lib/utils/cn";
import { useTimeGrid } from "../_hooks";
import type { Appointment, WorkingDayWithBreaks } from "../_lib/types";
import { DayColumn } from "./day-column";
import { TimeColumn } from "./time-column";
import { TimelineHeader } from "./timeline-header";

interface TimelineGridProps {
  dates: Date[];
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
  onAddWorkingDay?: (date: string) => void;
  onEditWorkingDay?: (workingDay: WorkingDayWithBreaks) => void;
  onEditBreak?: (breakData: WorkingDayWithBreaks["breaks"][number]) => void;
  className?: string;
}

/**
 * Main timeline grid component
 * Combines header, time column, and day columns
 */
export function TimelineGrid({
  dates,
  workingDays,
  appointments,
  beautyPageId,
  nickname,
  canManage,
  onAddWorkingDay,
  onEditWorkingDay,
  onEditBreak,
  className,
}: TimelineGridProps) {
  const { config, timeSlots, gridHeight } = useTimeGrid();

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header with day names and working hours */}
      <TimelineHeader
        dates={dates}
        workingDays={workingDays}
        canManage={canManage}
        onAddWorkingDay={onAddWorkingDay}
        onEditWorkingDay={onEditWorkingDay}
      />

      {/* Grid body - uses page scroll */}
      <div className="flex">
        {/* Time labels */}
        <div className="relative w-16 shrink-0" style={{ height: gridHeight }}>
          <TimeColumn timeSlots={timeSlots} />
        </div>

        {/* Day columns - unified grid with vertical dividers */}
        <div className="flex flex-1" style={{ height: gridHeight }}>
          {dates.map((date) => (
            <DayColumn
              key={date.toISOString()}
              date={date}
              workingDays={workingDays}
              appointments={appointments}
              config={config}
              beautyPageId={beautyPageId}
              nickname={nickname}
              canManage={canManage}
              onEditBreak={onEditBreak}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
