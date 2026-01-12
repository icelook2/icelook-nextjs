"use client";

import { Ban } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Paper } from "@/lib/ui/paper";
import { AppointmentCard } from "../../_components/appointment-card";
import { toDateString } from "../../_lib/date-utils";
import type { Appointment } from "../../_lib/types";
import { getAppointmentsForDate } from "../../_lib/workday-utils";

interface CancelledViewProps {
  appointments: Appointment[];
}

export function CancelledView({ appointments }: CancelledViewProps) {
  const { nickname } = useParams<{ nickname: string }>();

  const todayStr = toDateString(new Date());

  // Get today's appointments
  const todayAppointments = useMemo(
    () => getAppointmentsForDate(appointments, todayStr),
    [appointments, todayStr],
  );

  // Get cancelled appointments
  const cancelledAppointments = useMemo(
    () => todayAppointments.filter((apt) => apt.status === "cancelled"),
    [todayAppointments],
  );

  if (cancelledAppointments.length === 0) {
    return (
      <Paper className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <Ban className="h-8 w-8 text-muted" />
        </div>
        <p className="text-lg font-medium text-foreground">
          No cancelled appointments
        </p>
        <p className="mt-1 text-sm text-muted">
          Cancelled appointments will appear here
        </p>
      </Paper>
    );
  }

  return (
    <div className="space-y-3">
      {cancelledAppointments.map((apt) => (
        <AppointmentCard
          key={apt.id}
          appointment={apt}
          nickname={nickname}
          variant="queue"
        />
      ))}
    </div>
  );
}
