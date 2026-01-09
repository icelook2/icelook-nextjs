"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { rescheduleAppointment } from "../_actions";
import { useScheduleNavigation } from "../_hooks";
import type { WorkingDayBreak, WorkingDayWithBreaks } from "../_lib/types";
import type { Appointment } from "../_lib/types";
import { BreakDialog } from "./break-dialog";
import { ScheduleToolbar } from "./schedule-toolbar";
import { TimelineGrid } from "./timeline-grid";
import { WorkingDayDialog } from "./working-day-dialog";

interface ScheduleViewProps {
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

/**
 * Main schedule view orchestrator
 * Manages state for dialogs and coordinates all schedule interactions
 */
export function ScheduleView({
  beautyPageId,
  nickname,
  workingDays,
  appointments,
  canManage,
}: ScheduleViewProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

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

  // Handler for adding working day
  function handleAddWorkingDay(date: string) {
    setWorkingDayDialog({ open: true, mode: "create", date });
  }

  // Handler for editing working day
  function handleEditWorkingDay(workingDay: WorkingDayWithBreaks) {
    setWorkingDayDialog({ open: true, mode: "edit", workingDay });
  }

  // Handler for editing break
  function handleEditBreak(breakData: WorkingDayBreak) {
    setBreakDialog({
      open: true,
      mode: "edit",
      breakData,
      workingDayId: breakData.working_day_id,
    });
  }

  // Handler for creating a new break
  function handleAddBreak(workingDayId: string) {
    setBreakDialog({
      open: true,
      mode: "create",
      workingDayId,
    });
  }

  // Close handlers
  function closeWorkingDayDialog() {
    setWorkingDayDialog({ open: false });
  }

  function closeBreakDialog() {
    setBreakDialog({ open: false });
  }

  // Handler for rescheduling via drag
  function handleReschedule(result: {
    appointmentId: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
  }) {
    startTransition(async () => {
      const response = await rescheduleAppointment({
        appointmentId: result.appointmentId,
        beautyPageId,
        nickname,
        newDate: result.newDate,
        newStartTime: result.newStartTime,
        newEndTime: result.newEndTime,
      });

      if (response.success) {
        router.refresh();
      } else {
        // TODO: Show error toast
        console.error("Failed to reschedule:", response.error);
      }
    });
  }

  return (
    <div className="flex flex-col">
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
      <TimelineGrid
        dates={dates}
        workingDays={workingDays}
        appointments={appointments}
        beautyPageId={beautyPageId}
        nickname={nickname}
        canManage={canManage}
        onAddWorkingDay={handleAddWorkingDay}
        onEditWorkingDay={handleEditWorkingDay}
        onEditBreak={handleEditBreak}
        onReschedule={canManage ? handleReschedule : undefined}
      />

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
          beautyPageId={beautyPageId}
          nickname={nickname}
          onAddBreak={handleAddBreak}
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
    </div>
  );
}
