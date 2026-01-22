"use client";

import { UserX } from "lucide-react";
import { useParams } from "next/navigation";
import { Paper } from "@/lib/ui/paper";
import { AppointmentCard } from "../../_components/appointment-card";
import { toDateString } from "../../_lib/date-utils";
import type { Appointment } from "../../_lib/types";
import { getAppointmentsForDate } from "../../_lib/workday-utils";

interface NoShowViewProps {
  appointments: Appointment[];
}

export function NoShowView({ appointments }: NoShowViewProps) {
  const { nickname } = useParams<{ nickname: string }>();

  const todayStr = toDateString(new Date());

  // Derived values (React Compiler handles optimization)
  const todayAppointments = getAppointmentsForDate(appointments, todayStr);
  const noShowAppointments = todayAppointments.filter(
    (apt) => apt.status === "no_show",
  );

  if (noShowAppointments.length === 0) {
    return (
      <Paper className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <UserX className="h-8 w-8 text-muted" />
        </div>
        <p className="text-lg font-medium text-foreground">
          No no-show appointments
        </p>
        <p className="mt-1 text-sm text-muted">
          Clients who didn't show up will appear here
        </p>
      </Paper>
    );
  }

  return (
    <div className="space-y-3">
      {noShowAppointments.map((apt) => (
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
