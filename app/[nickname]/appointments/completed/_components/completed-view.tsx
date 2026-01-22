"use client";

import { CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Paper } from "@/lib/ui/paper";
import { AppointmentCard } from "../../_components/appointment-card";
import { toDateString } from "../../_lib/date-utils";
import type { Appointment } from "../../_lib/types";
import {
  getAppointmentsForDate,
  getCompletedAppointments,
} from "../../_lib/workday-utils";

interface CompletedViewProps {
  appointments: Appointment[];
}

export function CompletedView({ appointments }: CompletedViewProps) {
  const { nickname } = useParams<{ nickname: string }>();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Update current time every minute (less frequent since we're just showing completed)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const todayStr = toDateString(new Date());

  // Derived values (React Compiler handles optimization)
  const todayAppointments = getAppointmentsForDate(appointments, todayStr);
  const completedAppointments = getCompletedAppointments(
    todayAppointments,
    currentTime,
  );

  if (completedAppointments.length === 0) {
    return (
      <Paper className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <CheckCircle2 className="h-8 w-8 text-muted" />
        </div>
        <p className="text-lg font-medium text-foreground">
          No completed appointments
        </p>
        <p className="mt-1 text-sm text-muted">
          Appointments will appear here once they're done
        </p>
      </Paper>
    );
  }

  return (
    <div className="space-y-3">
      {completedAppointments.map((apt) => (
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
