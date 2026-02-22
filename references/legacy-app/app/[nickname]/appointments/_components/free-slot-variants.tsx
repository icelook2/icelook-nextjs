"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Paper } from "@/lib/ui/paper";

interface FreeSlotProps {
  startTime: string;
  durationMinutes: number;
  onBook?: () => void;
}

export function formatTime(time: string, locale: string): string {
  const [hours, minutes] = time.split(":").map(Number);

  if (locale === "en") {
    const period = hours >= 12 ? "pm" : "am";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")}${period}`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function AvailableSlot({
  startTime,
  durationMinutes,
  onBook,
}: FreeSlotProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const time = formatTime(startTime, locale);

  const formatDuration = () => {
    if (durationMinutes < 60) {
      return t("duration.minutes", { count: durationMinutes });
    }
    const hours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    if (remainingMinutes === 0) {
      return t("duration.hours", { count: hours });
    }
    return t("duration.hours_minutes", { hours, minutes: remainingMinutes });
  };

  return (
    <button type="button" onClick={onBook} className="w-full text-left">
      <Paper className="bg-surface/60 p-4 transition-colors hover:bg-surface dark:bg-surface/60 dark:hover:bg-surface">
        <div className="flex items-center gap-3">
          {/* Time on left */}
          <span className="w-14 shrink-0 text-lg text-muted">{time}</span>

          {/* Plus icon */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-500 dark:border-emerald-400">
            <Plus className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Content */}
          <span className="min-w-0 flex-1 text-muted">
            {t("available_slot")}
          </span>

          {/* Duration on right */}
          <span className="shrink-0 text-sm text-muted/60">
            {formatDuration()}
          </span>
        </div>
      </Paper>
    </button>
  );
}

interface PastEmptySlotProps {
  startTime: string;
}

export function PastEmptySlot({ startTime }: PastEmptySlotProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const time = formatTime(startTime, locale);

  return (
    <Paper className="p-4 opacity-50">
      <div className="flex items-center gap-3">
        <span className="w-16 text-lg font-semibold text-foreground">
          {time}
        </span>
        <p className="text-muted">{t("no_appointment")}</p>
      </div>
    </Paper>
  );
}
