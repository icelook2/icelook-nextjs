"use client";

import { cn } from "@/lib/utils/cn";
import { checkIsToday, toDateString } from "../_lib/date-utils";
import {
  findWorkingDayForDate,
  getAppointmentsForDate,
  sortBreaksByTime,
} from "../_lib/schedule-utils";
import { normalizeTime, timeToPercentage } from "../_lib/time-utils";
import type {
  Appointment,
  GridConfig,
  WorkingDayWithBreaks,
} from "../_lib/types";
import { AppointmentBlock } from "./appointment-block";
import { BreakBlock } from "./break-block";
import { EmptyDaySlot } from "./empty-day-slot";

interface DayColumnProps {
  date: Date;
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
  config: GridConfig;
  canManage: boolean;
  onAddWorkingDay?: (date: string) => void;
  onEditBreak?: (breakData: WorkingDayWithBreaks["breaks"][number]) => void;
  onViewAppointment?: (appointment: Appointment) => void;
  className?: string;
}

/**
 * Single day column in the timeline
 * Contains working hours, breaks, and appointments
 */
export function DayColumn({
  date,
  workingDays,
  appointments,
  config,
  canManage,
  onAddWorkingDay,
  onEditBreak,
  onViewAppointment,
  className,
}: DayColumnProps) {
  const dateStr = toDateString(date);
  const isToday = checkIsToday(date);
  const workingDay = findWorkingDayForDate(workingDays, dateStr);
  const dayAppointments = getAppointmentsForDate(appointments, dateStr);

  // Sort breaks by time
  const sortedBreaks = workingDay ? sortBreaksByTime(workingDay.breaks) : [];

  // Calculate working hours position percentages
  const workingHoursPosition = workingDay
    ? {
        startPercent: timeToPercentage(
          normalizeTime(workingDay.start_time),
          config,
        ),
        endPercent: timeToPercentage(
          normalizeTime(workingDay.end_time),
          config,
        ),
      }
    : null;

  return (
    <div
      className={cn(
        "relative flex-1 border-r border-border/30 last:border-r-0",
        isToday && "ring-2 ring-accent/30",
        className,
      )}
    >
      {/* Working hours background tint - shows working vs non-working areas */}
      {workingHoursPosition && (
        <>
          {/* Non-working hours BEFORE working period - dimmed */}
          {workingHoursPosition.startPercent > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bg-muted/30 dark:bg-muted/20"
              style={{ height: `${workingHoursPosition.startPercent}%` }}
            />
          )}

          {/* Working hours area - subtle accent tint */}
          <div
            className="pointer-events-none absolute inset-x-0 bg-accent/5 dark:bg-accent/10"
            style={{
              top: `${workingHoursPosition.startPercent}%`,
              height: `${workingHoursPosition.endPercent - workingHoursPosition.startPercent}%`,
            }}
          />

          {/* Non-working hours AFTER working period - dimmed */}
          {workingHoursPosition.endPercent < 100 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-muted/30 dark:bg-muted/20"
              style={{
                height: `${100 - workingHoursPosition.endPercent}%`,
              }}
            />
          )}
        </>
      )}

      {/* Grid lines for hours - subtle */}
      {Array.from({ length: config.endHour - config.startHour + 1 }, (_, i) => (
        <div
          key={`hour-${config.startHour + i}`}
          className="absolute left-0 right-0 border-t border-border/20"
          style={{
            top: `${(i / (config.endHour - config.startHour)) * 100}%`,
          }}
        />
      ))}

      {workingDay ? (
        <>
          {/* Breaks */}
          {sortedBreaks.map((breakData) => (
            <BreakBlock
              key={breakData.id}
              breakData={breakData}
              config={config}
              canManage={canManage}
              onClick={() => onEditBreak?.(breakData)}
            />
          ))}

          {/* Appointments */}
          {dayAppointments.map((appointment) => (
            <AppointmentBlock
              key={appointment.id}
              appointment={appointment}
              config={config}
              onClick={() => onViewAppointment?.(appointment)}
            />
          ))}
        </>
      ) : (
        <EmptyDaySlot
          date={date}
          canManage={canManage}
          onClick={() => onAddWorkingDay?.(dateStr)}
        />
      )}
    </div>
  );
}
