"use client";

import { useState } from "react";
import { format, isToday, parseISO } from "date-fns";
import { Calendar, Clock, Mail, Phone, Scissors, User } from "lucide-react";
import { Avatar } from "@/lib/ui/avatar";
import { Paper } from "@/lib/ui/paper";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/price-range";
import type {
  Appointment,
  ClientHistorySummary,
} from "@/lib/queries/appointments";
import { getAppointmentStatusColor } from "../../../../settings/schedule/_lib/schedule-utils";
import {
  calculateDurationMinutes,
  formatTimeRange,
  formatTimeRemaining,
  formatTimeUntil,
} from "../../../_lib/workday-utils";
import { AppointmentActions } from "./appointment-actions";
import { ClientHistoryCard } from "./client-history-card";
import { CreatorNotesSection } from "./creator-notes-section";

interface AppointmentDetailsViewProps {
  appointment: Appointment;
  clientHistory: ClientHistorySummary | null;
  clientKey: string;
  nickname: string;
  beautyPageId: string;
}

export function AppointmentDetailsView({
  appointment,
  clientHistory,
  clientKey,
  nickname,
  beautyPageId,
}: AppointmentDetailsViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const statusColors = getAppointmentStatusColor(appointment.status);

  const appointmentDate = parseISO(appointment.date);
  const isAppointmentToday = isToday(appointmentDate);
  const durationMinutes = calculateDurationMinutes(
    appointment.start_time,
    appointment.end_time,
  );

  // Update current time every minute for countdown
  useState(() => {
    if (isAppointmentToday) {
      const interval = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(interval);
    }
  });

  // Check if appointment is currently active
  const currentMinutes =
    currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes =
    Number.parseInt(appointment.start_time.split(":")[0]) * 60 +
    Number.parseInt(appointment.start_time.split(":")[1]);
  const endMinutes =
    Number.parseInt(appointment.end_time.split(":")[0]) * 60 +
    Number.parseInt(appointment.end_time.split(":")[1]);
  const isActive =
    isAppointmentToday &&
    currentMinutes >= startMinutes &&
    currentMinutes < endMinutes;
  const isUpcoming = isAppointmentToday && currentMinutes < startMinutes;

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium capitalize",
            statusColors.bg,
            statusColors.text,
          )}
        >
          {appointment.status}
        </span>
        {isActive && (
          <span className="text-sm font-medium text-accent">
            {formatTimeRemaining(appointment.end_time, currentTime)}
          </span>
        )}
        {isUpcoming && (
          <span className="text-sm text-muted">
            {formatTimeUntil(appointment.start_time, currentTime)}
          </span>
        )}
      </div>

      {/* Service Card */}
      <Paper className="bg-accent/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Scissors className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              {appointment.service_name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {formatDuration(durationMinutes)} •{" "}
              {(appointment.service_price_cents / 100).toFixed(0)}{" "}
              {appointment.service_currency}
            </p>
          </div>
        </div>
      </Paper>

      {/* Schedule */}
      <Paper className="p-4">
        <h3 className="mb-3 text-sm font-medium text-muted">Schedule</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-muted" />
            <span>{format(appointmentDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-muted" />
            <span>
              {formatTimeRange(appointment.start_time, appointment.end_time)}
            </span>
          </div>
        </div>
      </Paper>

      {/* Client Info */}
      <Paper className="p-4">
        <h3 className="mb-3 text-sm font-medium text-muted">Client</h3>
        <div className="space-y-4">
          {/* Name + Avatar */}
          <div className="flex items-center gap-3">
            <Avatar name={appointment.client_name} size="md" />
            <div>
              <p className="font-semibold text-foreground">
                {appointment.client_name}
              </p>
              {!appointment.client_id && (
                <span className="text-xs text-muted">Guest</span>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            <a
              href={`tel:${appointment.client_phone}`}
              className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-accent"
            >
              <Phone className="h-4 w-4 text-muted" />
              {appointment.client_phone}
            </a>
            {appointment.client_email && (
              <a
                href={`mailto:${appointment.client_email}`}
                className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 text-muted" />
                {appointment.client_email}
              </a>
            )}
          </div>

          {/* Client notes (from booking) */}
          {appointment.client_notes && (
            <div className="rounded-lg bg-muted/10 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                <User className="h-3 w-3" />
                Client notes
              </div>
              <p className="text-sm text-foreground">
                {appointment.client_notes}
              </p>
            </div>
          )}
        </div>
      </Paper>

      {/* Creator Notes (editable) */}
      <CreatorNotesSection
        appointmentId={appointment.id}
        beautyPageId={beautyPageId}
        nickname={nickname}
        initialNotes={appointment.creator_notes}
      />

      {/* Client History (if returning client) */}
      {clientHistory && clientHistory.totalVisits > 0 && (
        <ClientHistoryCard
          history={clientHistory}
          nickname={nickname}
          clientKey={clientKey}
        />
      )}

      {/* Actions */}
      <AppointmentActions
        appointment={appointment}
        nickname={nickname}
        beautyPageId={beautyPageId}
      />
    </div>
  );
}
