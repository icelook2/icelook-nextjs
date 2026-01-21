"use client";

/**
 * Day Off Appointments Context
 *
 * Manages state for handling appointments when marking a day as day off.
 *
 * Key features:
 * - Multi-step navigation (appointments list → reschedule date → reschedule time → cancel confirm)
 * - Pending actions tracking (changes staged, not executed until final submit)
 * - Atomic submission via RPC (all changes applied together)
 */

import { createContext, type ReactNode, useContext, useState } from "react";
import { markDayOffWithChanges } from "../../_actions/working-day.actions";
import type { DayOffAppointment } from "../../_actions/working-day.actions";

// ============================================================================
// Types
// ============================================================================

/** Steps in the day-off flow */
export type DayOffStep =
  | "appointments" // List view - initial step
  | "reschedule-date" // Selecting new date for reschedule
  | "reschedule-time" // Selecting new time for reschedule
  | "cancel-confirm"; // Confirming cancellation

/** Pending action for an appointment (staged, not yet executed) */
export type PendingAction =
  | {
      type: "reschedule";
      date: string; // YYYY-MM-DD
      startTime: string; // HH:MM
      endTime: string; // HH:MM
    }
  | {
      type: "cancel";
      reason?: string;
    };

/** Appointment with pending action tracking */
export interface AppointmentWithPending extends DayOffAppointment {
  pendingAction: PendingAction | null;
}

/** Working day info for rescheduling */
export interface WorkingDayOption {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

interface DayOffAppointmentsContextValue {
  // Step navigation
  step: DayOffStep;
  goToStep: (step: DayOffStep) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Current appointment being configured
  targetAppointment: AppointmentWithPending | null;
  setTargetAppointment: (apt: AppointmentWithPending | null) => void;

  // Reschedule flow state (for multi-step)
  rescheduleDate: Date | null;
  setRescheduleDate: (date: Date | null) => void;
  rescheduleTime: string | null;
  setRescheduleTime: (time: string | null) => void;

  // Cancel flow state
  cancelReason: string;
  setCancelReason: (reason: string) => void;

  // Appointments with pending actions
  appointments: AppointmentWithPending[];

  // Stage actions (does NOT execute immediately)
  stageReschedule: (
    appointmentId: string,
    date: string,
    startTime: string,
    endTime: string,
  ) => void;
  stageCancel: (appointmentId: string, reason?: string) => void;
  clearPendingAction: (appointmentId: string) => void;

  // Final submission (atomic via RPC)
  submitAllChanges: () => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;

  // Derived
  pendingCount: number;
  totalCount: number;
}

interface DayOffAppointmentsProviderProps {
  children: ReactNode;
  initialAppointments: DayOffAppointment[];
  workingDayId: string;
  workingDayDate: string; // YYYY-MM-DD (date being marked as day off)
  beautyPageId: string;
  nickname: string;
  workingDays: WorkingDayOption[];
  onSuccess?: () => void;
}

// ============================================================================
// Context
// ============================================================================

const DayOffAppointmentsContext =
  createContext<DayOffAppointmentsContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useDayOffAppointments(): DayOffAppointmentsContextValue {
  const context = useContext(DayOffAppointmentsContext);
  if (!context) {
    throw new Error(
      "useDayOffAppointments must be used within a DayOffAppointmentsProvider",
    );
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export function DayOffAppointmentsProvider({
  children,
  initialAppointments,
  workingDayId,
  workingDayDate,
  beautyPageId,
  nickname,
  workingDays,
  onSuccess,
}: DayOffAppointmentsProviderProps) {
  // Step navigation state
  const [step, setStep] = useState<DayOffStep>("appointments");

  // Initialize appointments with null pending actions
  const [appointments, setAppointments] = useState<AppointmentWithPending[]>(
    initialAppointments.map((apt) => ({
      ...apt,
      pendingAction: null,
    })),
  );

  // Current appointment being configured
  const [targetAppointment, setTargetAppointment] =
    useState<AppointmentWithPending | null>(null);

  // Reschedule flow state
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);

  // Cancel flow state
  const [cancelReason, setCancelReason] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step order for back navigation
  const getStepHistory = (currentStep: DayOffStep): DayOffStep | null => {
    switch (currentStep) {
      case "reschedule-date":
        return "appointments";
      case "reschedule-time":
        return "reschedule-date";
      case "cancel-confirm":
        return "appointments";
      default:
        return null;
    }
  };

  // Navigation handlers
  const goToStep = (newStep: DayOffStep) => {
    setStep(newStep);
    setError(null);
  };

  const canGoBack = step !== "appointments";

  const goBack = () => {
    const previousStep = getStepHistory(step);
    if (previousStep) {
      // Clear temporary state when going back
      if (step === "reschedule-date") {
        setRescheduleDate(null);
        setTargetAppointment(null);
      } else if (step === "reschedule-time") {
        setRescheduleTime(null);
      } else if (step === "cancel-confirm") {
        setCancelReason("");
        setTargetAppointment(null);
      }
      setStep(previousStep);
      setError(null);
    }
  };

  // Stage a reschedule action (does NOT execute immediately)
  const stageReschedule = (
    appointmentId: string,
    date: string,
    startTime: string,
    endTime: string,
  ) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? {
              ...apt,
              pendingAction: {
                type: "reschedule",
                date,
                startTime,
                endTime,
              },
            }
          : apt,
      ),
    );
    // Reset flow state and return to list
    setTargetAppointment(null);
    setRescheduleDate(null);
    setRescheduleTime(null);
    setStep("appointments");
  };

  // Stage a cancel action (does NOT execute immediately)
  const stageCancel = (appointmentId: string, reason?: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? {
              ...apt,
              pendingAction: {
                type: "cancel",
                reason,
              },
            }
          : apt,
      ),
    );
    // Reset flow state and return to list
    setTargetAppointment(null);
    setCancelReason("");
    setStep("appointments");
  };

  // Clear a pending action from an appointment
  const clearPendingAction = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, pendingAction: null } : apt,
      ),
    );
  };

  // Submit all changes atomically
  const submitAllChanges = async (): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    // Build changes array from pending actions
    const changes = appointments
      .filter((apt) => apt.pendingAction !== null)
      .map((apt) => {
        const action = apt.pendingAction!;
        if (action.type === "reschedule") {
          return {
            appointmentId: apt.id,
            action: "reschedule" as const,
            newDate: action.date,
            newStartTime: action.startTime,
            newEndTime: action.endTime,
          };
        }
        return {
          appointmentId: apt.id,
          action: "cancel" as const,
          cancelReason: action.reason,
        };
      });

    const result = await markDayOffWithChanges({
      workingDayId,
      beautyPageId,
      nickname,
      changes,
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
      return true;
    }

    setError(result.error);
    return false;
  };

  // Derived values
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(
    (apt) => apt.pendingAction !== null,
  ).length;

  // Context value
  const value: DayOffAppointmentsContextValue = {
    // Step navigation
    step,
    goToStep,
    goBack,
    canGoBack,

    // Target appointment
    targetAppointment,
    setTargetAppointment,

    // Reschedule flow
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,

    // Cancel flow
    cancelReason,
    setCancelReason,

    // Appointments
    appointments,

    // Staging actions
    stageReschedule,
    stageCancel,
    clearPendingAction,

    // Submission
    submitAllChanges,
    isSubmitting,
    error,

    // Derived
    pendingCount,
    totalCount,
  };

  return (
    <DayOffAppointmentsContext.Provider value={value}>
      {children}
    </DayOffAppointmentsContext.Provider>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate end time based on start time and duration
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

/**
 * Generate time options in 15-minute increments
 * Only includes times where the appointment can fit before working hours end
 */
export function generateTimeOptions(
  workingStartTime: string,
  workingEndTime: string,
  serviceDurationMinutes: number,
): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];

  const [startHours, startMinutes] = workingStartTime.split(":").map(Number);
  const [endHours, endMinutes] = workingEndTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  // Latest possible start time (must fit the service before end of day)
  const latestStartMinutes = endTotalMinutes - serviceDurationMinutes;

  // Generate options in 15-minute increments
  for (
    let minutes = startTotalMinutes;
    minutes <= latestStartMinutes;
    minutes += 15
  ) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    options.push({
      value: timeStr,
      label: timeStr,
    });
  }

  return options;
}
