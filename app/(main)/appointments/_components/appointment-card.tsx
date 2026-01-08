"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ClientAppointment } from "@/lib/queries/appointments";
import { SettingsRow } from "@/lib/ui/settings-group";
import { StatusBadge } from "./status-badge";

interface AppointmentCardProps {
  appointment: ClientAppointment;
  onClick: () => void;
  noBorder?: boolean;
}

export function AppointmentCard({
  appointment,
  onClick,
  noBorder,
}: AppointmentCardProps) {
  const t = useTranslations("appointments");
  const locale = useLocale();

  const dateTime = new Date(`${appointment.date}T${appointment.start_time}`);
  const formattedDate = dateTime.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = dateTime.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SettingsRow noBorder={noBorder}>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 text-left transition-opacity hover:opacity-70"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium">{appointment.service_name}</p>
          <p className="text-sm text-muted">
            {formattedDate} {t("at")} {formattedTime}
          </p>
          <p className="text-sm text-muted">
            {appointment.creator_display_name}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </button>
    </SettingsRow>
  );
}
