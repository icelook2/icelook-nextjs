"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  markNoShow,
  startAppointmentEarly,
} from "@/app/[nickname]/appointments/_actions";
import type { Appointment } from "@/lib/queries/appointments";
import { Button } from "@/lib/ui/button";

interface AppointmentActionsCardProps {
  appointment: Appointment;
  beautyPageId: string;
  nickname: string;
  currentTime: Date;
}

export function AppointmentActionsCard({
  appointment,
  beautyPageId,
  nickname,
  currentTime,
}: AppointmentActionsCardProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isPending = appointment.status === "pending";
  const isConfirmed = appointment.status === "confirmed";

  // Determine if confirmed appointment is upcoming or active
  const currentTimeStr = `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;
  const isUpcoming = isConfirmed && currentTimeStr < appointment.start_time;
  const isActive =
    isConfirmed &&
    currentTimeStr >= appointment.start_time &&
    currentTimeStr < appointment.end_time;

  const isLoading =
    isConfirming ||
    isDeclining ||
    isMarkingNoShow ||
    isStarting ||
    isCompleting;
  const hasActions = isPending || isConfirmed;

  // Don't render if no actions available
  if (!hasActions) {
    return null;
  }

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const result = await confirmAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const result = await cancelAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsDeclining(false);
    }
  };

  const handleReschedule = () => {
    // TODO: Implement reschedule dialog/navigation
    console.log("Reschedule clicked");
  };

  const handleCancel = async () => {
    setIsDeclining(true);
    try {
      const result = await cancelAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsDeclining(false);
    }
  };

  const handleNoShow = async () => {
    setIsMarkingNoShow(true);
    try {
      const result = await markNoShow({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const result = await startAppointmentEarly({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await completeAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Actions</h2>
      <div className="flex items-center gap-2">
        {/* Pending actions */}
        {isPending && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isConfirming ? "Confirming..." : "Confirm"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDecline}
              disabled={isLoading}
            >
              {isDeclining ? "Declining..." : "Decline"}
            </Button>
          </>
        )}

        {/* Upcoming confirmed - can start early */}
        {isUpcoming && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStart}
              disabled={isLoading}
            >
              {isStarting ? "Starting..." : "Start"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleReschedule}>
              Reschedule
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNoShow}
              disabled={isLoading}
            >
              {isMarkingNoShow ? "Marking..." : "No-show"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isDeclining ? "Cancelling..." : "Cancel"}
            </Button>
          </>
        )}

        {/* Active appointment - can complete early */}
        {isActive && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleComplete}
              disabled={isLoading}
            >
              {isCompleting ? "Completing..." : "Complete"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNoShow}
              disabled={isLoading}
            >
              {isMarkingNoShow ? "Marking..." : "No-show"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isDeclining ? "Cancelling..." : "Cancel"}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
