"use client";

import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getAppointmentStatusColor } from "../_lib/schedule-utils";
import { normalizeTime } from "../_lib/time-utils";
import type { Appointment, GridConfig } from "../_lib/types";

interface AppointmentBlockProps {
  appointment: Appointment;
  config: GridConfig;
  onClick?: () => void;
  className?: string;
}

/**
 * Visual block representing an appointment
 * Positioned absolutely within the day column
 */
export function AppointmentBlock({
  appointment,
  config,
  onClick,
  className,
}: AppointmentBlockProps) {
  const startTime = normalizeTime(appointment.start_time);
  const endTime = normalizeTime(appointment.end_time);
  const statusColors = getAppointmentStatusColor(appointment.status);

  // Calculate position as percentage
  const totalMinutes = (config.endHour - config.startHour) * 60;
  const startMinutes =
    Number.parseInt(startTime.split(":")[0], 10) * 60 +
    Number.parseInt(startTime.split(":")[1], 10) -
    config.startHour * 60;
  const endMinutes =
    Number.parseInt(endTime.split(":")[0], 10) * 60 +
    Number.parseInt(endTime.split(":")[1], 10) -
    config.startHour * 60;

  const topPercent = (startMinutes / totalMinutes) * 100;
  const heightPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;

  // Determine how much content to show based on block size
  const showDetails = heightPercent > 8;
  const showTime = heightPercent > 5;

  return (
    <button
      type="button"
      className={cn(
        "absolute inset-x-2 z-20 overflow-hidden rounded border text-left transition-colors",
        statusColors.bg,
        statusColors.border,
        "cursor-pointer hover:brightness-95 dark:hover:brightness-110",
        appointment.status === "cancelled" && "opacity-50",
        className,
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
      }}
      onClick={onClick}
    >
      <div className="flex h-full flex-col p-1.5">
        {/* Client name - always show */}
        <div className={cn("flex items-center gap-1", statusColors.text)}>
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate text-xs font-medium">
            {appointment.client_name}
          </span>
        </div>

        {/* Service name - show if space allows */}
        {showDetails && (
          <p
            className={cn(
              "mt-0.5 truncate text-xs",
              statusColors.text,
              "opacity-80",
            )}
          >
            {appointment.service_name}
          </p>
        )}

        {/* Time - show if space allows */}
        {showTime && (
          <div
            className={cn(
              "mt-auto flex items-center gap-1",
              statusColors.text,
              "opacity-70",
            )}
          >
            <Clock className="h-3 w-3" />
            <span className="text-xs">
              {startTime} - {endTime}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
