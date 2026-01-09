"use client";

import { format, isToday } from "date-fns";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "../../settings/schedule/_lib/types";
import {
  confirmAppointment,
  cancelAppointment,
} from "../../settings/schedule/_actions/appointment.actions";
import {
  getCurrentAppointment,
  getUpcomingAppointments,
  getCompletedAppointments,
  getAppointmentsForDate,
} from "../_lib/workday-utils";
import { NowQueueView } from "./now-queue-view";
import { WorkdayToolbar } from "./workday-toolbar";

interface WorkdayViewProps {
  beautyPageId: string;
  nickname: string;
  appointments: Appointment[];
  selectedDate: Date;
}

export function WorkdayView({
  beautyPageId,
  nickname,
  appointments,
  selectedDate,
}: WorkdayViewProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const isViewingToday = isToday(selectedDate);
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  // Update current time every second for countdown accuracy (only matters for today)
  useEffect(() => {
    if (!isViewingToday) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isViewingToday]);

  // Appointments for the selected date
  const dateAppointments = useMemo(
    () => getAppointmentsForDate(appointments, selectedDateStr),
    [appointments, selectedDateStr],
  );

  // Compute current and upcoming appointments (only makes sense for today)
  const currentAppointment = useMemo(
    () => (isViewingToday ? getCurrentAppointment(dateAppointments, currentTime) : null),
    [dateAppointments, currentTime, isViewingToday],
  );

  const upcomingAppointments = useMemo(
    () =>
      isViewingToday
        ? getUpcomingAppointments(dateAppointments, currentTime)
        : dateAppointments.filter(
            (apt) => apt.status === "pending" || apt.status === "confirmed",
          ),
    [dateAppointments, currentTime, isViewingToday],
  );

  // Completed appointments for today (ended or marked complete)
  const completedAppointments = useMemo(
    () => (isViewingToday ? getCompletedAppointments(dateAppointments, currentTime) : []),
    [dateAppointments, currentTime, isViewingToday],
  );

  // Handle confirm action
  const handleConfirm = async (appointmentId: string) => {
    setConfirmingId(appointmentId);

    startTransition(async () => {
      const result = await confirmAppointment({
        appointmentId,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        router.refresh();
      }

      setConfirmingId(null);
    });
  };

  // Handle decline action (for pending appointments)
  const handleDecline = async (appointmentId: string) => {
    setDecliningId(appointmentId);

    startTransition(async () => {
      const result = await cancelAppointment({
        appointmentId,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        router.refresh();
      }

      setDecliningId(null);
    });
  };

  // Handle cancel action (for confirmed appointments)
  const handleCancel = async (appointmentId: string) => {
    setCancellingId(appointmentId);

    startTransition(async () => {
      const result = await cancelAppointment({
        appointmentId,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        router.refresh();
      }

      setCancellingId(null);
    });
  };

  // Handle reschedule action
  const handleReschedule = (appointmentId: string) => {
    // Navigate to schedule page with appointment context
    router.push(`/${nickname}/settings/schedule?reschedule=${appointmentId}`);
  };

  return (
    <div className="flex h-full flex-col">
      <WorkdayToolbar currentDate={selectedDate} />

      <NowQueueView
        currentAppointment={currentAppointment}
        upcomingAppointments={upcomingAppointments}
        completedAppointments={completedAppointments}
        currentTime={currentTime}
        isToday={isViewingToday}
        onApprove={handleConfirm}
        onDecline={handleDecline}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        approvingId={confirmingId}
        decliningId={decliningId}
        cancellingId={cancellingId}
      />
    </div>
  );
}
