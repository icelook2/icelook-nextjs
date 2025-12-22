"use client";

import { useState } from "react";
import { useScheduleNavigation } from "../_hooks";
import type {
  Appointment,
  WorkingDayBreak,
  WorkingDayWithBreaks,
} from "../_lib/types";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import { BreakDialog } from "./break-dialog";
import { ScheduleToolbar } from "./schedule-toolbar";
import { TimelineGrid } from "./timeline-grid";
import { WorkingDayDialog } from "./working-day-dialog";

interface ScheduleViewProps {
  specialistId: string;
  beautyPageId: string;
  nickname: string;
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
  canManage: boolean;
}

// Dialog state types
type WorkingDayDialogState =
  | { open: false }
  | { open: true; mode: "create"; date: string }
  | { open: true; mode: "edit"; workingDay: WorkingDayWithBreaks };

type BreakDialogState =
  | { open: false }
  | { open: true; mode: "create"; workingDayId: string }
  | {
      open: true;
      mode: "edit";
      breakData: WorkingDayBreak;
      workingDayId: string;
    };

type AppointmentDialogState =
  | { open: false }
  | { open: true; appointment: Appointment };

/**
 * Main schedule view orchestrator
 * Manages state for dialogs and coordinates all schedule interactions
 */
export function ScheduleView({
  specialistId,
  beautyPageId,
  nickname,
  workingDays,
  appointments,
  canManage,
}: ScheduleViewProps) {
  // Navigation state from URL
  const {
    viewMode,
    currentDate,
    dates,
    setViewMode,
    setDate,
    goToToday,
    goToPrevious,
    goToNext,
  } = useScheduleNavigation();

  // Dialog states
  const [workingDayDialog, setWorkingDayDialog] =
    useState<WorkingDayDialogState>({ open: false });
  const [breakDialog, setBreakDialog] = useState<BreakDialogState>({
    open: false,
  });
  const [appointmentDialog, setAppointmentDialog] =
    useState<AppointmentDialogState>({ open: false });

  // Handler for adding working day
  function handleAddWorkingDay(date: string) {
    setWorkingDayDialog({ open: true, mode: "create", date });
  }

  // Handler for editing working day
  function handleEditWorkingDay(workingDay: WorkingDayWithBreaks) {
    setWorkingDayDialog({ open: true, mode: "edit", workingDay });
  }

  // Handler for editing break (or creating new one)
  function handleEditBreak(breakData: WorkingDayBreak) {
    setBreakDialog({
      open: true,
      mode: "edit",
      breakData,
      workingDayId: breakData.working_day_id,
    });
  }

  // Handler for viewing appointment
  function handleViewAppointment(appointment: Appointment) {
    setAppointmentDialog({ open: true, appointment });
  }

  // Close handlers
  function closeWorkingDayDialog() {
    setWorkingDayDialog({ open: false });
  }

  function closeBreakDialog() {
    setBreakDialog({ open: false });
  }

  function closeAppointmentDialog() {
    setAppointmentDialog({ open: false });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <ScheduleToolbar
        viewMode={viewMode}
        currentDate={currentDate}
        dates={dates}
        onViewModeChange={setViewMode}
        onDateChange={setDate}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
      />

      {/* Timeline grid */}
      <div className="flex-1 overflow-hidden">
        <TimelineGrid
          dates={dates}
          workingDays={workingDays}
          appointments={appointments}
          canManage={canManage}
          onAddWorkingDay={handleAddWorkingDay}
          onEditWorkingDay={handleEditWorkingDay}
          onEditBreak={handleEditBreak}
          onViewAppointment={handleViewAppointment}
        />
      </div>

      {/* Dialogs */}
      {workingDayDialog.open && (
        <WorkingDayDialog
          open={workingDayDialog.open}
          onClose={closeWorkingDayDialog}
          mode={workingDayDialog.mode}
          date={
            workingDayDialog.mode === "create"
              ? workingDayDialog.date
              : undefined
          }
          workingDay={
            workingDayDialog.mode === "edit"
              ? workingDayDialog.workingDay
              : undefined
          }
          specialistId={specialistId}
          beautyPageId={beautyPageId}
          nickname={nickname}
        />
      )}

      {breakDialog.open && (
        <BreakDialog
          open={breakDialog.open}
          onClose={closeBreakDialog}
          mode={breakDialog.mode}
          workingDayId={breakDialog.workingDayId}
          breakData={
            breakDialog.mode === "edit" ? breakDialog.breakData : undefined
          }
          beautyPageId={beautyPageId}
          nickname={nickname}
        />
      )}

      {appointmentDialog.open && (
        <AppointmentDetailDialog
          open={appointmentDialog.open}
          onClose={closeAppointmentDialog}
          appointment={appointmentDialog.appointment}
          beautyPageId={beautyPageId}
          nickname={nickname}
          canManage={canManage}
        />
      )}
    </div>
  );
}
