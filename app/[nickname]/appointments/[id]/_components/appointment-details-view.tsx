"use client";

import { useEffect, useState } from "react";
import type {
  Appointment,
  ClientHistorySummary,
} from "@/lib/queries/appointments";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import type { VisitPreferences } from "@/lib/types/visit-preferences";
import { isEmptyPreferences } from "@/lib/types/visit-preferences";
import {
  type ActionConfirmationTranslations,
  AppointmentActionsCard,
  type QuickRescheduleTranslations,
} from "./appointment-actions-card";
import { AppointmentDateTimeCard } from "./appointment-date-time-card";
import { ClientDetailsCard } from "./client-details-card";
import { ClientNotesCard } from "./client-notes-card";
import { CreatorNotesEditableCard } from "./creator-notes-editable-card";
import { LastAppointmentCard } from "./last-appointment-card";
import { ServicesCard } from "./services-card";
import { VisitPreferencesCard } from "./visit-preferences-card";

export interface DateTimeTranslations {
  date: string;
  time: string;
}

interface AppointmentDetailsViewProps {
  appointment: Appointment;
  clientHistory: ClientHistorySummary | null;
  clientKey: string;
  nickname: string;
  beautyPageId: string;
  creatorNotes: string | null;
  serviceGroups: ServiceGroupWithServices[];
  rescheduleTranslations: QuickRescheduleTranslations;
  actionTranslations: ActionConfirmationTranslations;
  dateTimeTranslations: DateTimeTranslations;
}

export function AppointmentDetailsView({
  appointment,
  clientHistory,
  clientKey,
  nickname,
  beautyPageId,
  creatorNotes,
  serviceGroups,
  rescheduleTranslations,
  actionTranslations,
  dateTimeTranslations,
}: AppointmentDetailsViewProps) {
  // Track current time for determining if appointment is upcoming or active
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hasClientNotes = Boolean(appointment.client_notes);
  const isReturningClient = clientHistory && clientHistory.totalVisits > 0;
  const visitPreferences =
    appointment.visit_preferences as VisitPreferences | null;
  const hasVisitPreferences = !isEmptyPreferences(visitPreferences);

  // Only allow service modifications for pending or confirmed appointments
  const canModifyServices =
    appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div className="space-y-4">
      {/* 1. CLIENT DETAILS - Who is this? */}
      <ClientDetailsCard
        clientName={appointment.client_name}
        clientId={appointment.client_id}
        clientHistory={clientHistory}
        clientKey={clientKey}
        nickname={nickname}
      />

      {/* 2. DATE & TIME - When is the appointment? */}
      <AppointmentDateTimeCard
        date={appointment.date}
        startTime={appointment.start_time}
        translations={dateTimeTranslations}
      />

      {/* 3. ACTIONS - Call, Confirm, Decline, etc. */}
      <AppointmentActionsCard
        appointment={appointment}
        beautyPageId={beautyPageId}
        nickname={nickname}
        currentTime={currentTime}
        rescheduleTranslations={rescheduleTranslations}
        actionTranslations={actionTranslations}
      />

      {/* 3. VISIT PREFERENCES - Accessibility & communication needs */}
      {hasVisitPreferences && (
        <VisitPreferencesCard preferences={visitPreferences!} />
      )}

      {/* 3. NOTES FROM CLIENT - Their message at booking */}
      {hasClientNotes && <ClientNotesCard notes={appointment.client_notes!} />}

      {/* 4. YOUR NOTES - Creator's notes about this client */}
      <CreatorNotesEditableCard
        beautyPageId={beautyPageId}
        nickname={nickname}
        clientId={appointment.client_id}
        clientPhone={appointment.client_phone}
        initialNotes={creatorNotes}
      />

      {/* 5. SERVICES - What are they booking? */}
      <ServicesCard
        appointment={appointment}
        canModify={canModifyServices}
        beautyPageId={beautyPageId}
        nickname={nickname}
        serviceGroups={serviceGroups}
      />

      {/* 6. LAST APPOINTMENT - History with this client */}
      {isReturningClient && (
        <LastAppointmentCard
          clientHistory={clientHistory}
          nickname={nickname}
        />
      )}
    </div>
  );
}
