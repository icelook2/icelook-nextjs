"use client";

import { Calendar, Clock } from "lucide-react";
import { useLocale } from "next-intl";
import { Paper } from "@/lib/ui/paper";

interface AppointmentDateTimeCardProps {
  /** Appointment date in YYYY-MM-DD format */
  date: string;
  /** Start time in HH:MM:SS format */
  startTime: string;
  /** Translations */
  translations: {
    date: string;
    time: string;
  };
}

export function AppointmentDateTimeCard({
  date,
  startTime,
  translations,
}: AppointmentDateTimeCardProps) {
  const locale = useLocale();

  const dateTime = new Date(`${date}T${startTime}`);
  const formattedDate = dateTime.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateTime.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Paper className="p-4">
        <Calendar className="mb-2 h-5 w-5 text-muted" />
        <p className="text-xs uppercase tracking-wide text-muted">
          {translations.date}
        </p>
        <p className="mt-1 font-medium text-foreground">{formattedDate}</p>
      </Paper>
      <Paper className="p-4">
        <Clock className="mb-2 h-5 w-5 text-muted" />
        <p className="text-xs uppercase tracking-wide text-muted">
          {translations.time}
        </p>
        <p className="mt-1 font-medium text-foreground">{formattedTime}</p>
      </Paper>
    </div>
  );
}
