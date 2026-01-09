"use client";

import { CalendarOff, CheckCircle2, ChevronRight, Coffee } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Paper } from "@/lib/ui/paper";
import type { Appointment } from "../../settings/schedule/_lib/types";
import {
  formatBreakDuration,
  getBreakMinutes,
} from "../_lib/workday-utils";
import { AppointmentCard } from "./appointment-card";

interface NowQueueViewProps {
  currentAppointment: Appointment | null;
  upcomingAppointments: Appointment[];
  completedAppointments: Appointment[];
  currentTime: Date;
  isToday?: boolean;
  // Action callbacks
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  approvingId?: string | null;
  decliningId?: string | null;
  cancellingId?: string | null;
}

export function NowQueueView({
  currentAppointment,
  upcomingAppointments,
  completedAppointments,
  currentTime,
  isToday = true,
  onApprove,
  onDecline,
  onReschedule,
  onCancel,
  approvingId,
  decliningId,
  cancellingId,
}: NowQueueViewProps) {
  const { nickname } = useParams<{ nickname: string }>();

  // For non-today dates, show all appointments in a simple list
  if (!isToday) {
    const allAppointments = [...completedAppointments, ...upcomingAppointments];

    return (
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-base font-semibold">
            Appointments ({allAppointments.length})
          </h2>

          {allAppointments.length > 0 ? (
            <div className="space-y-3">
              {allAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  currentTime={currentTime}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <Paper className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarOff className="mb-2 h-6 w-6 text-muted" />
              <p className="text-sm text-muted">No appointments on this day</p>
            </Paper>
          )}
        </section>
      </div>
    );
  }

  // Calculate break until next appointment (from current appointment end or now)
  const getBreakUntilNext = () => {
    if (upcomingAppointments.length === 0) {
      return null;
    }

    const nextApt = upcomingAppointments[0];
    let referenceEndTime: string;

    if (currentAppointment) {
      referenceEndTime = currentAppointment.end_time;
    } else {
      // Use current time as reference
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const mins = currentTime.getMinutes().toString().padStart(2, "0");
      referenceEndTime = `${hours}:${mins}`;
    }

    const breakMins = getBreakMinutes(referenceEndTime, nextApt.start_time);
    return breakMins > 0 ? formatBreakDuration(breakMins) : null;
  };

  const breakUntilNext = getBreakUntilNext();

  return (
    <div className="space-y-6">
      {/* Current appointment section */}
      <section>
        <h2 className="mb-3 text-base font-semibold">
          Current Appointment
        </h2>

        {currentAppointment ? (
          <AppointmentCard
            appointment={currentAppointment}
            currentTime={currentTime}
            variant="hero"
            isActive
          />
        ) : (
          <Paper className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
              <Coffee className="h-8 w-8 text-muted" />
            </div>
            <p className="text-lg font-medium text-foreground">Free time</p>
            <p className="mt-1 text-sm text-muted">
              {upcomingAppointments.length > 0
                ? "Next client coming soon"
                : "No more appointments today"}
            </p>
          </Paper>
        )}
      </section>

      {/* Upcoming section with break indicators */}
      {upcomingAppointments.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Upcoming Appointments
            </h2>
            {breakUntilNext && (
              <span className="text-sm text-muted">{breakUntilNext}</span>
            )}
          </div>

          <div className="space-y-2">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                currentTime={currentTime}
                variant="queue"
                onApprove={onApprove}
                onDecline={onDecline}
                onReschedule={onReschedule}
                onCancel={onCancel}
                isApproving={approvingId === apt.id}
                isDeclining={decliningId === apt.id}
                isCancelling={cancellingId === apt.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed section - links to completed page */}
      {completedAppointments.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">
            Other
          </h2>
          <Link
            href={`/${nickname}/workday/completed`}
            className="block w-full rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Completed Appointments</p>
                  <p className="text-sm text-muted">
                    {completedAppointments.length} appointment
                    {completedAppointments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <ChevronRight className="h-5 w-5 text-muted" />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Empty state when no upcoming */}
      {upcomingAppointments.length === 0 && !currentAppointment && completedAppointments.length === 0 && (
        <Paper className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarOff className="mb-2 h-6 w-6 text-muted" />
          <p className="text-sm text-muted">No appointments today</p>
        </Paper>
      )}
    </div>
  );
}
