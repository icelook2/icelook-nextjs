"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ClientAppointment } from "@/lib/queries/appointments";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { AppointmentCard } from "./appointment-card";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";

interface AppointmentsListProps {
  upcoming: ClientAppointment[];
  past: ClientAppointment[];
}

export function AppointmentsList({ upcoming, past }: AppointmentsListProps) {
  const t = useTranslations("appointments");
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleCardClick(appointment: ClientAppointment) {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  }

  const hasNoAppointments = upcoming.length === 0 && past.length === 0;

  if (hasNoAppointments) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Calendar className="h-6 w-6 text-accent" />
        </div>
        <p className="font-medium">{t("no_appointments")}</p>
        <p className="text-sm text-muted">{t("book_first")}</p>
        <Link href="/search" className="mt-4 inline-block">
          <Button size="sm">{t("find_specialists")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Section */}
      <SettingsGroup title={t("upcoming")}>
        {upcoming.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted">
            {t("no_upcoming")}
          </div>
        ) : (
          upcoming.map((appointment, index) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={() => handleCardClick(appointment)}
              noBorder={index === upcoming.length - 1}
            />
          ))
        )}
      </SettingsGroup>

      {/* Past Section */}
      {past.length > 0 && (
        <SettingsGroup title={t("past")}>
          {past.map((appointment, index) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={() => handleCardClick(appointment)}
              noBorder={index === past.length - 1}
            />
          ))}
        </SettingsGroup>
      )}

      {/* Detail Dialog */}
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
