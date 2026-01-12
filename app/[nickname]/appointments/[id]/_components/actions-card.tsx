"use client";

import { CalendarClock, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Appointment } from "@/lib/queries/appointments";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";

interface ActionsCardProps {
  appointment: Appointment;
}

export function ActionsCard({ appointment }: ActionsCardProps) {
  const t = useTranslations("appointment_details.actions");

  // Don't show actions for terminal states
  const isTerminalState =
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show";

  if (isTerminalState) {
    return null;
  }

  const handleReschedule = () => {
    // TODO: Implement reschedule functionality
    console.log("Reschedule clicked");
  };

  const handleCancel = () => {
    // TODO: Implement cancel functionality
    console.log("Cancel clicked");
  };

  return (
    <SettingsGroup title={t("title")}>
      {/* Re-schedule */}
      <SettingsRow onClick={handleReschedule}>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t("reschedule")}</p>
              <p className="text-sm text-muted">
                {t("reschedule_description")}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
        </div>
      </SettingsRow>

      {/* Cancel */}
      <SettingsRow onClick={handleCancel} noBorder>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
              <X className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-red-600 dark:text-red-400">
                {t("cancel")}
              </p>
              <p className="text-sm text-muted">{t("cancel_description")}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
        </div>
      </SettingsRow>
    </SettingsGroup>
  );
}
