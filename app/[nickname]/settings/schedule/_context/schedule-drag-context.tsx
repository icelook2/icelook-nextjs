"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import {
  calculateDraggedTimes,
  checkAppointmentConflict,
  checkWithinWorkingHours,
  snapTimeToInterval,
} from "../_lib/drag-utils";
import { normalizeTime, timeToMinutes, minutesToTime } from "../_lib/time-utils";
import type { Appointment, GridConfig, WorkingDayWithBreaks } from "../_lib/types";

// ============================================================================
// Types
// ============================================================================

interface DragData {
  type: "appointment";
  appointment: Appointment;
}

interface DropResult {
  appointmentId: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}

interface ScheduleDragContextValue {
  /** Currently dragging appointment (null when not dragging) */
  activeAppointment: Appointment | null;
  /** Whether any drag is in progress */
  isDragging: boolean;
}

const ScheduleDragContext = createContext<ScheduleDragContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface ScheduleDragProviderProps {
  children: ReactNode;
  /** All dates in the current view */
  dates: Date[];
  /** All appointments for conflict detection */
  appointments: Appointment[];
  /** Working days for validation */
  workingDays: WorkingDayWithBreaks[];
  /** Grid configuration */
  config: GridConfig;
  /** Reference to the grid container for position calculations */
  gridRef: React.RefObject<HTMLDivElement | null>;
  /** Callback when drag completes successfully */
  onDragComplete?: (result: DropResult) => void;
}

export function ScheduleDragProvider({
  children,
  dates,
  appointments,
  workingDays,
  config,
  gridRef,
  onDragComplete,
}: ScheduleDragProviderProps) {
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // Configure sensors with activation delay for long-press
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 300, // 300ms long-press required
      tolerance: 5, // 5px movement allowed during delay
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 5,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data?.type === "appointment") {
      setActiveAppointment(data.appointment);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      setActiveAppointment(null);

      // If no grid reference or no meaningful movement, cancel
      if (!gridRef.current || (Math.abs(delta.x) < 5 && Math.abs(delta.y) < 5)) return;

      const data = active.data.current as DragData | undefined;
      if (!data || data.type !== "appointment") return;

      const appointment = data.appointment;
      const gridRect = gridRef.current.getBoundingClientRect();

      // Calculate new time based on Y delta
      const totalMinutes = (config.endHour - config.startHour) * 60;
      const deltaMinutes = (delta.y / gridRect.height) * totalMinutes;
      const originalStartMinutes = timeToMinutes(normalizeTime(appointment.start_time));
      const newStartMinutes = originalStartMinutes + deltaMinutes;
      const snappedStartTime = snapTimeToInterval(minutesToTime(newStartMinutes), 15);

      // Calculate new date based on X delta
      const dayWidth = gridRect.width / dates.length;
      const originalDayIndex = dates.findIndex(
        (d) => d.toISOString().split("T")[0] === appointment.date
      );
      const dayOffset = Math.round(delta.x / dayWidth);
      const newDayIndex = Math.max(0, Math.min(originalDayIndex + dayOffset, dates.length - 1));
      const newDate = dates[newDayIndex].toISOString().split("T")[0];

      // Calculate new end time (preserve duration)
      const { endTime: newEndTime } = calculateDraggedTimes(
        appointment.start_time,
        appointment.end_time,
        snappedStartTime
      );

      // Validate the new position
      const workingHoursCheck = checkWithinWorkingHours(
        newDate,
        snappedStartTime,
        newEndTime,
        workingDays
      );

      if (!workingHoursCheck.isValid) {
        // Invalid position - don't complete drag
        return;
      }

      const conflictCheck = checkAppointmentConflict(
        newDate,
        snappedStartTime,
        newEndTime,
        appointments,
        appointment.id
      );

      if (conflictCheck.hasConflict) {
        // Has conflict - don't complete drag
        return;
      }

      // Valid drop - call completion callback
      onDragComplete?.({
        appointmentId: appointment.id,
        newDate,
        newStartTime: snappedStartTime,
        newEndTime,
      });
    },
    [gridRef, dates, config, appointments, workingDays, onDragComplete]
  );

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveAppointment(null);
  }, []);

  const contextValue = useMemo<ScheduleDragContextValue>(
    () => ({
      activeAppointment,
      isDragging: activeAppointment !== null,
    }),
    [activeAppointment]
  );

  return (
    <ScheduleDragContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* Drag overlay - visual feedback during drag */}
        <DragOverlay dropAnimation={null}>
          {activeAppointment && (
            <DragOverlayContent appointment={activeAppointment} />
          )}
        </DragOverlay>
      </DndContext>
    </ScheduleDragContext.Provider>
  );
}

// ============================================================================
// Drag Overlay Content
// ============================================================================

function DragOverlayContent({ appointment }: { appointment: Appointment }) {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-2 shadow-lg",
        "border border-accent/30 bg-accent-soft",
        "pointer-events-none"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-medium text-accent">
          {normalizeTime(appointment.start_time)} – {normalizeTime(appointment.end_time)}
        </span>
        <div className="h-4 w-px bg-accent/30" />
        <span className="text-sm text-accent">{appointment.client_name}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useScheduleDrag(): ScheduleDragContextValue {
  const context = useContext(ScheduleDragContext);
  if (!context) {
    throw new Error("useScheduleDrag must be used within a ScheduleDragProvider");
  }
  return context;
}
