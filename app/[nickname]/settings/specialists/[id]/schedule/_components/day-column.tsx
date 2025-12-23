"use client";

import { cn } from "@/lib/utils/cn";
import { checkIsToday, toDateString } from "../_lib/date-utils";
import {
  findWorkingDayForDate,
  getAppointmentsForDate,
  sortBreaksByTime,
} from "../_lib/schedule-utils";
import type {
  Appointment,
  GridConfig,
  WorkingDayWithBreaks,
} from "../_lib/types";
import { AppointmentBlock } from "./appointment-block";
import { BreakBlock } from "./break-block";
import { EmptyDaySlot } from "./empty-day-slot";
import { WorkingDayBlock } from "./working-day-block";

interface DayColumnProps {
  date: Date;
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
  config: GridConfig;
  canManage: boolean;
  onAddWorkingDay?: (date: string) => void;
  onEditWorkingDay?: (workingDay: WorkingDayWithBreaks) => void;
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
  onEditWorkingDay,
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

  return (
    <div
      className={cn(
        "relative flex-1 rounded-lg bg-surface",
        isToday && "ring-2 ring-accent/30",
        className,
      )}
    >
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
          {/* Working day block */}
          <WorkingDayBlock
            workingDay={workingDay}
            config={config}
            canManage={canManage}
            onClick={() => onEditWorkingDay?.(workingDay)}
          />

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
