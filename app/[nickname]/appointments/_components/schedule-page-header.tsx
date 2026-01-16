"use client";

import {
  addDays,
  addMonths,
  format,
  isToday,
  isTomorrow,
  isYesterday,
  subDays,
  subMonths,
} from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, EllipsisVertical } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { WeekCalendarExpanded } from "./week-calendar";

interface SchedulePageHeaderProps {
  selectedDate: Date;
  workingDates: Set<string>;
  workingHours: string | null;
}

const localeMap = { en: enUS, uk } as const;

export function SchedulePageHeader({
  selectedDate,
  workingDates,
  workingHours,
}: SchedulePageHeaderProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const formatDateLabel = () => {
    const currentYear = new Date().getFullYear();
    const showYear = selectedDate.getFullYear() !== currentYear;
    const dateFormat = showYear ? "d MMMM yyyy" : "d MMMM";
    const formattedDate = format(selectedDate, dateFormat, { locale: dateFnsLocale });

    if (isToday(selectedDate)) {
      return `${t("today")}, ${formattedDate}`;
    }

    if (isTomorrow(selectedDate)) {
      return `${t("tomorrow")}, ${formattedDate}`;
    }

    if (isYesterday(selectedDate)) {
      return `${t("yesterday")}, ${formattedDate}`;
    }

    return formattedDate;
  };

  const navigateToDate = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(date, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrev = () => {
    if (calendarExpanded) {
      setViewDate(subMonths(viewDate, 1));
    } else {
      navigateToDate(subDays(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (calendarExpanded) {
      setViewDate(addMonths(viewDate, 1));
    } else {
      navigateToDate(addDays(selectedDate, 1));
    }
  };

  return (
    <>
      <header className="bg-background pb-6">
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCalendarExpanded(!calendarExpanded)}
              className="min-w-0 flex-1 text-left"
            >
              <h1 className="text-lg font-semibold">{formatDateLabel()}</h1>
              <p className="mt-0.5 text-sm text-muted">
                {format(selectedDate, "EEEE", { locale: dateFnsLocale })}
                {workingHours && ` · ${workingHours}`}
              </p>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:bg-accent hover:text-white"
                aria-label="More options"
              >
                <EllipsisVertical className="size-5" />
              </button>

              <button
                type="button"
                onClick={handlePrev}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:bg-accent hover:text-white"
                aria-label={calendarExpanded ? "Previous month" : "Previous day"}
              >
                <ChevronLeft className="size-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:bg-accent hover:text-white"
                aria-label={calendarExpanded ? "Next month" : "Next day"}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {calendarExpanded && (
        <div className="mx-auto max-w-2xl px-4 pb-4">
          <WeekCalendarExpanded
            selectedDate={selectedDate}
            workingDates={workingDates}
            expanded={calendarExpanded}
            onExpandedChange={setCalendarExpanded}
            viewDate={viewDate}
            onViewDateChange={setViewDate}
          />
        </div>
      )}
    </>
  );
}
