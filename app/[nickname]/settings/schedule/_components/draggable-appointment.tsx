"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils/cn";
import { useScheduleDrag } from "../_context";
import { normalizeTime } from "../_lib/time-utils";
import type {
  Appointment,
  GridConfig,
} from "../_lib/types";
import { AppointmentBlock } from "./appointment-block";

interface DraggableAppointmentProps {
  appointment: Appointment;
  config: GridConfig;
  beautyPageId: string;
  nickname: string;
  canManage: boolean;
  className?: string;
}

/**
 * Wrapper component that adds drag functionality to AppointmentBlock
 * Uses dnd-kit for drag handling with long-press activation
 */
export function DraggableAppointment({
  appointment,
  config,
  beautyPageId,
  nickname,
  canManage,
  className,
}: DraggableAppointmentProps) {
  const { isDragging: isAnyDragging } = useScheduleDrag();

  // Only pending/confirmed appointments can be dragged
  const canDrag =
    canManage &&
    (appointment.status === "pending" || appointment.status === "confirmed");

  // Set up dnd-kit draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: appointment.id,
    data: {
      type: "appointment",
      appointment,
    },
    disabled: !canDrag,
  });

  // Calculate position as percentage
  const startTime = normalizeTime(appointment.start_time);
  const endTime = normalizeTime(appointment.end_time);
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

  // Apply transform during drag
  const style = {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    minHeight: "20px",
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    // Reduce opacity when being dragged (original stays in place, overlay follows cursor)
    opacity: isDragging ? 0.5 : 1,
  };

  // If can't drag, just render the appointment block without drag wrapper
  if (!canDrag) {
    return (
      <AppointmentBlock
        appointment={appointment}
        config={config}
        beautyPageId={beautyPageId}
        nickname={nickname}
        canManage={canManage}
        className={className}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-x-1 touch-none",
        canDrag && "cursor-grab",
        isDragging && "cursor-grabbing",
        className,
      )}
      style={style}
      {...listeners}
      {...attributes}
    >
      <AppointmentBlock
        appointment={appointment}
        config={config}
        beautyPageId={beautyPageId}
        nickname={nickname}
        canManage={canManage}
        // Disable popover when any drag is happening
        popoverOpen={isAnyDragging ? false : undefined}
        onPopoverOpenChange={isAnyDragging ? () => {} : undefined}
        fillParent
        className={cn(
          isDragging && "ring-2 ring-accent ring-offset-2",
        )}
      />
    </div>
  );
}
