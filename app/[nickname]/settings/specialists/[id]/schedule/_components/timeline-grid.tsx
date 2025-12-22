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
  canManage: boolean;
  onAddWorkingDay?: (date: string) => void;
  onEditWorkingDay?: (workingDay: WorkingDayWithBreaks) => void;
  onEditBreak?: (breakData: WorkingDayWithBreaks["breaks"][number]) => void;
  onViewAppointment?: (appointment: Appointment) => void;
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
  canManage,
  onAddWorkingDay,
  onEditWorkingDay,
  onEditBreak,
  onViewAppointment,
  className,
}: TimelineGridProps) {
  const { config, timeSlots, gridHeight } = useTimeGrid();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header with day names */}
      <TimelineHeader dates={dates} />

      {/* Scrollable body */}
      <div className="flex flex-1 overflow-auto">
        {/* Time labels */}
        <div className="relative w-16 shrink-0" style={{ height: gridHeight }}>
          <TimeColumn timeSlots={timeSlots} />
        </div>

        {/* Day columns */}
        <div className="flex flex-1" style={{ height: gridHeight }}>
          {dates.map((date) => (
            <DayColumn
              key={date.toISOString()}
              date={date}
              workingDays={workingDays}
              appointments={appointments}
              config={config}
              canManage={canManage}
              onAddWorkingDay={onAddWorkingDay}
              onEditWorkingDay={onEditWorkingDay}
              onEditBreak={onEditBreak}
              onViewAppointment={onViewAppointment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
