"use client";

import { cn } from "@/lib/utils/cn";
import { normalizeTime } from "../_lib/time-utils";
import type { Appointment, GridConfig } from "../_lib/types";
import { AppointmentPopover } from "./appointment-popover";

interface AppointmentBlockProps {
  appointment: Appointment;
  config: GridConfig;
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
  /** Controlled popover open state (optional) */
  popoverOpen?: boolean;
  /** Callback when popover open state should change (optional) */
  onPopoverOpenChange?: (open: boolean) => void;
  /** When true, fills parent container instead of absolute positioning */
  fillParent?: boolean;
  className?: string;
}

/**
 * Get status-based styling - soft colored backgrounds for floating card effect
 */
function getStatusStyles(status: Appointment["status"]): {
  background: string;
  border: string;
  text: string;
} {
  switch (status) {
    case "pending":
      return {
        background: "bg-warning-soft",
        border: "border-warning/30",
        text: "text-warning",
      };
    case "confirmed":
      return {
        background: "bg-success-soft",
        border: "border-success/30",
        text: "text-success",
      };
    case "completed":
      return {
        background: "bg-info-soft",
        border: "border-info/30",
        text: "text-info",
      };
    case "cancelled":
    case "no_show":
      return {
        background: "bg-surface-alt",
        border: "border-border",
        text: "text-muted",
      };
    default:
      return {
        background: "bg-surface-alt",
        border: "border-border",
        text: "text-muted",
      };
  }
}

/**
 * Visual block representing an appointment
 * Card-like design with subtle background and status indicator
 * Wraps with popover for quick actions on click
 */
export function AppointmentBlock({
  appointment,
  config,
  beautyPageId,
  nickname,
  canManage,
  popoverOpen,
  onPopoverOpenChange,
  fillParent,
  className,
}: AppointmentBlockProps) {
  const startTime = normalizeTime(appointment.start_time);
  const endTime = normalizeTime(appointment.end_time);

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
  const isCompact = heightPercent < 6;
  const showService = heightPercent > 8;

  const styles = getStatusStyles(appointment.status);
  const isCancelled =
    appointment.status === "cancelled" || appointment.status === "no_show";

  return (
    <AppointmentPopover
      appointment={appointment}
      beautyPageId={beautyPageId}
      nickname={nickname}
      canManage={canManage}
      open={popoverOpen}
      onOpenChange={onPopoverOpenChange}
    >
      <button
        type="button"
        className={cn(
          "overflow-hidden rounded-lg text-left transition-all",
          // Floating card - colored background with subtle border and shadow
          "border shadow-sm",
          styles.background,
          styles.border,
          "hover:shadow-md hover:brightness-[1.02] dark:hover:brightness-110",
          isCancelled && "opacity-60",
          // Positioning: either fill parent or absolute
          fillParent ? "relative h-full w-full" : "absolute inset-x-1",
          className,
        )}
        style={
          fillParent
            ? undefined
            : {
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
                minHeight: "20px",
              }
        }
      >
        <div
          className={cn(
            "flex h-full flex-col px-2",
            isCompact ? "justify-center py-0.5" : "py-1.5",
          )}
        >
          {/* Client name - always visible */}
          <span
            className={cn(
              "truncate text-xs font-medium",
              isCancelled ? "text-muted line-through" : "text-foreground",
            )}
          >
            {appointment.client_name}
          </span>

          {/* Service name - show if space allows */}
          {showService && (
            <span className="mt-0.5 truncate text-xs text-muted">
              {appointment.service_name}
            </span>
          )}

          {/* Time - show at bottom if not compact */}
          {!isCompact && (
            <span className={cn("mt-auto text-[10px]", styles.text)}>
              {startTime} – {endTime}
            </span>
          )}
        </div>
      </button>
    </AppointmentPopover>
  );
}
