"use client";

import { cn } from "@/lib/utils/cn";
import { checkIsToday, toDateString } from "../_lib/date-utils";
import {
  findWorkingDayForDate,
  getAppointmentsForDate,
  sortBreaksByTime,
} from "../_lib/schedule-utils";
import { normalizeTime } from "../_lib/time-utils";
import type {
  Appointment,
  GridConfig,
  WorkingDayWithBreaks,
} from "../_lib/types";
import { AppointmentBlock } from "./appointment-block";
import { BreakBlock } from "./break-block";

interface DayColumnProps {
  date: Date;
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
  config: GridConfig;
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
  onEditBreak?: (breakData: WorkingDayWithBreaks["breaks"][number]) => void;
  className?: string;
}

/**
 * Calculate unavailable regions (before and after working hours)
 */
function getUnavailableRegions(
  workingDay: WorkingDayWithBreaks | null,
  config: GridConfig,
): { before: number; after: number } {
  if (!workingDay) {
    return { before: 100, after: 0 }; // Entire day is unavailable
  }

  const totalMinutes = (config.endHour - config.startHour) * 60;
  const startTime = normalizeTime(workingDay.start_time);
  const endTime = normalizeTime(workingDay.end_time);

  // Minutes from grid start to working hours start
  const workStartMinutes =
    Number.parseInt(startTime.split(":")[0], 10) * 60 +
    Number.parseInt(startTime.split(":")[1], 10) -
    config.startHour * 60;

  // Minutes from grid start to working hours end
  const workEndMinutes =
    Number.parseInt(endTime.split(":")[0], 10) * 60 +
    Number.parseInt(endTime.split(":")[1], 10) -
    config.startHour * 60;

  const beforePercent = Math.max(0, (workStartMinutes / totalMinutes) * 100);
  const afterPercent = Math.max(
    0,
    ((totalMinutes - workEndMinutes) / totalMinutes) * 100,
  );

  return { before: beforePercent, after: afterPercent };
}

/**
 * Single day column in the timeline
 * Working hours are implicit - we show unavailable areas instead
 */
export function DayColumn({
  date,
  workingDays,
  appointments,
  config,
  beautyPageId,
  nickname,
  canManage,
  onEditBreak,
  className,
}: DayColumnProps) {
  const dateStr = toDateString(date);
  const isToday = checkIsToday(date);
  const workingDay = findWorkingDayForDate(workingDays, dateStr);
  const dayAppointments = getAppointmentsForDate(appointments, dateStr);

  // Sort breaks by time
  const sortedBreaks = workingDay ? sortBreaksByTime(workingDay.breaks) : [];

  // Calculate unavailable regions
  const unavailable = getUnavailableRegions(workingDay, config);

  return (
    <div
      className={cn(
        "relative flex-1 border-r border-border last:border-r-0",
        isToday && "bg-accent/5",
        className,
      )}
    >
      {/* Grid lines for hours - subtle */}
      {Array.from({ length: config.endHour - config.startHour + 1 }, (_, i) => (
        <div
          key={`hour-${config.startHour + i}`}
          className="absolute left-0 right-0 border-t border-border/10"
          style={{
            top: `${(i / (config.endHour - config.startHour)) * 100}%`,
          }}
        />
      ))}

      {/* Unavailable region BEFORE working hours - hatched pattern */}
      {unavailable.before > 0 && (
        <div
          className="unavailable-pattern absolute inset-x-0 top-0"
          style={{ height: `${unavailable.before}%` }}
        />
      )}

      {/* Unavailable region AFTER working hours - hatched pattern */}
      {unavailable.after > 0 && (
        <div
          className="unavailable-pattern absolute inset-x-0 bottom-0"
          style={{ height: `${unavailable.after}%` }}
        />
      )}

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
          beautyPageId={beautyPageId}
          nickname={nickname}
          canManage={canManage}
        />
      ))}
    </div>
  );
}
