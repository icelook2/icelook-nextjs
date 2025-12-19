"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Appointment } from "@/lib/appointments";
import { SpecialistAppointmentCard } from "./specialist-appointment-card";

interface SpecialistAppointmentsListProps {
  upcoming: Appointment[];
  past: Appointment[];
  specialistUsername: string;
}

type Tab = "upcoming" | "past";

export function SpecialistAppointmentsList({
  upcoming,
  past,
  specialistUsername,
}: SpecialistAppointmentsListProps) {
  const t = useTranslations("specialist.settings.appointments");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const hasAnyAppointments = upcoming.length > 0 || past.length > 0;

  // Empty state
  if (!hasAnyAppointments) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-foreground/5 flex items-center justify-center">
          <Calendar className="h-8 w-8 text-foreground/30" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t("no_appointments")}
        </h3>
        <p className="text-foreground/60 text-sm max-w-xs mx-auto">
          {t("waiting_for_bookings")}
        </p>
      </div>
    );
  }

  const appointments = activeTab === "upcoming" ? upcoming : past;
  const emptyMessage =
    activeTab === "upcoming" ? t("no_upcoming") : t("no_past");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-foreground/10">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "upcoming"
              ? "border-violet-500 text-violet-600 dark:text-violet-400"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          {t("upcoming")} ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "past"
              ? "border-violet-500 text-violet-600 dark:text-violet-400"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          {t("past")} ({past.length})
        </button>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/50 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <SpecialistAppointmentCard
              key={appointment.id}
              appointment={appointment}
              showActions={activeTab === "upcoming"}
              specialistUsername={specialistUsername}
            />
          ))}
        </div>
      )}
    </div>
  );
}
