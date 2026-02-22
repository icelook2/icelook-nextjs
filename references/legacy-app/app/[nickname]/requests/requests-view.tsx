"use client";

import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  parseISO,
} from "date-fns";
import { ArrowDownUp, Calendar, Check, Clock, Inbox, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import {
  cancelAppointment,
  confirmAppointment,
} from "../appointments/_actions/appointment.actions";
import type { Appointment } from "../appointments/_lib/types";

type SortMode = "recent" | "soonest";

interface RequestsViewProps {
  beautyPageId: string;
  nickname: string;
  appointments: Appointment[];
}

export function RequestsView({
  beautyPageId,
  nickname,
  appointments,
}: RequestsViewProps) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  // Derived value (React Compiler handles optimization)
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (sortMode === "recent") {
      // Sort by created_at descending (newest first)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    // Sort by date + start_time ascending (soonest first)
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return a.start_time.localeCompare(b.start_time);
  });

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

  if (appointments.length === 0) {
    return (
      <Paper className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <Inbox className="h-8 w-8 text-muted" />
        </div>
        <p className="text-lg font-medium text-foreground">
          No pending requests
        </p>
        <p className="mt-1 text-sm text-muted">
          All appointment requests have been processed
        </p>
      </Paper>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {appointments.length} request{appointments.length !== 1 ? "s" : ""}{" "}
          waiting
        </p>

        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setSortMode(sortMode === "recent" ? "soonest" : "recent")
          }
          className="gap-1.5"
        >
          <ArrowDownUp className="h-4 w-4" />
          {sortMode === "recent" ? "Recent first" : "Soonest first"}
        </Button>
      </div>

      {/* Request cards */}
      <div className="space-y-3">
        {sortedAppointments.map((apt) => (
          <RequestCard
            key={apt.id}
            appointment={apt}
            onConfirm={handleConfirm}
            onDecline={handleDecline}
            isConfirming={confirmingId === apt.id}
            isDeclining={decliningId === apt.id}
          />
        ))}
      </div>
    </div>
  );
}

interface RequestCardProps {
  appointment: Appointment;
  onConfirm: (appointmentId: string) => Promise<void>;
  onDecline: (appointmentId: string) => Promise<void>;
  isConfirming: boolean;
  isDeclining: boolean;
}

function RequestCard({
  appointment,
  onConfirm,
  onDecline,
  isConfirming,
  isDeclining,
}: RequestCardProps) {
  const isProcessing = isConfirming || isDeclining;
  const appointmentDate = parseISO(appointment.date);
  const bookedAgo = formatDistanceToNow(parseISO(appointment.created_at), {
    addSuffix: true,
  });

  // Format appointment date label
  let dateLabel: string;
  if (isToday(appointmentDate)) {
    dateLabel = "Today";
  } else if (isTomorrow(appointmentDate)) {
    dateLabel = "Tomorrow";
  } else {
    dateLabel = format(appointmentDate, "EEE, MMM d");
  }

  return (
    <Paper className="p-4">
      <div className="flex items-start justify-between gap-3">
        {/* Left: Client & Service info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {appointment.client_name}
          </h3>
          <p className="text-sm text-muted">{appointment.service_name}</p>

          {/* Time details */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5 text-foreground">
              <Calendar className="h-4 w-4 text-muted" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <Clock className="h-4 w-4 text-muted" />
              <span>
                {appointment.start_time.slice(0, 5)} –{" "}
                {appointment.end_time.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Booked time */}
          <p className="mt-2 text-xs text-muted">Booked {bookedAgo}</p>
        </div>

        {/* Right: Action buttons */}
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDecline(appointment.id)}
            disabled={isProcessing}
            className="gap-1.5 text-muted hover:text-danger"
          >
            {isDeclining ? (
              "..."
            ) : (
              <>
                <X className="h-4 w-4" />
                Decline
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfirm(appointment.id)}
            disabled={isProcessing}
            className="gap-1.5"
          >
            {isConfirming ? (
              "..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Approve
              </>
            )}
          </Button>
        </div>
      </div>
    </Paper>
  );
}
