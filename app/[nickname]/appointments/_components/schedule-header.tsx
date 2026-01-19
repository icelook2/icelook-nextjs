"use client";

import { addDays, addMonths, format, subDays, subMonths } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import {
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ScheduleMenu } from "./schedule-menu";
import { SimpleDatePicker } from "./simple-date-picker";

type FilterType = "all" | "confirmed" | "pending";

interface WorkingDayInfo {
  id: string;
  startTime: string;
  endTime: string;
}

interface ScheduleHeaderProps {
  selectedDate: Date;
  appointmentCount: number;
  pendingCount: number;
  workingHours: string | null;
  /** Working day info for the selected date */
  workingDay: WorkingDayInfo | null;
  /** Beauty page ID for actions */
  beautyPageId: string;
  /** Nickname for URL revalidation */
  nickname: string;
  /** Working day dates for calendar display (YYYY-MM-DD format) */
  workingDates?: Set<string>;
  /** Dates with confirmed appointments (YYYY-MM-DD format) */
  appointmentDates?: Set<string>;
  /** Dates with pending appointments (YYYY-MM-DD format) */
  pendingDates?: Set<string>;
  /** Current filter type */
  filter?: FilterType;
}

const localeMap = { en: enUS, uk } as const;

export function ScheduleHeader({
  selectedDate,
  appointmentCount,
  pendingCount,
  workingHours,
  workingDay,
  beautyPageId,
  nickname,
  workingDates,
  appointmentDates,
  pendingDates,
  filter = "all",
}: ScheduleHeaderProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate);

  const dayOfWeek = format(selectedDate, "EEEE", { locale: dateFnsLocale });
  const isCurrentYear = selectedDate.getFullYear() === new Date().getFullYear();
  const dateFormat = isCurrentYear ? "d MMMM" : "d MMMM yyyy";
  const formattedDate = format(selectedDate, dateFormat, {
    locale: dateFnsLocale,
  });
  const confirmedCount = appointmentCount - pendingCount;

  const navigateToDate = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(date, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleFilter = (filterType: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    // Toggle: if already active, go back to "all" (remove param)
    if (filter === filterType) {
      params.delete("filter");
    } else {
      params.set("filter", filterType);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrev = () => {
    if (calendarOpen) {
      setViewDate(subMonths(viewDate, 1));
    } else {
      navigateToDate(subDays(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (calendarOpen) {
      setViewDate(addMonths(viewDate, 1));
    } else {
      navigateToDate(addDays(selectedDate, 1));
    }
  };

  const handleDateSelect = (date: Date) => {
    navigateToDate(date);
    setCalendarOpen(false);
  };

  const handleToggleCalendar = () => {
    if (!calendarOpen) {
      setViewDate(selectedDate);
    }
    setCalendarOpen(!calendarOpen);
  };

  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggleCalendar}
          className="text-left"
        >
          <p className="text-sm text-muted">{dayOfWeek}</p>
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-semibold">{formattedDate}</h1>
            <ChevronDown
              className={`size-5 text-muted transition-transform ${calendarOpen ? "rotate-180" : ""}`}
            />
          </div>
          <p className="text-sm text-muted">{workingHours ?? t("day_off")}</p>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:bg-accent hover:text-white"
            aria-label={calendarOpen ? "Previous month" : "Previous day"}
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:bg-accent hover:text-white"
            aria-label={calendarOpen ? "Next month" : "Next day"}
          >
            <ChevronRight className="size-5" />
          </button>

          <ScheduleMenu
            selectedDate={selectedDate}
            workingDay={workingDay}
            beautyPageId={beautyPageId}
            nickname={nickname}
            workingDates={workingDates}
          />
        </div>
      </div>

      {calendarOpen && (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          <SimpleDatePicker
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            hideHeader
            showMonthLabel
            fullWidth
            viewDate={viewDate}
            workingDates={workingDates}
            appointmentDates={appointmentDates}
            pendingDates={pendingDates}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => toggleFilter("confirmed")}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-sm transition-colors",
            filter === "confirmed"
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface hover:bg-white/5",
          )}
        >
          <CalendarCheck
            className={cn("size-4", filter !== "confirmed" && "text-muted")}
          />
          <span>
            {confirmedCount}{" "}
            {confirmedCount === 1 ? t("appointment") : t("appointments")}
          </span>
        </button>

        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => toggleFilter("pending")}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-sm transition-colors",
              filter === "pending"
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-amber-600 hover:bg-white/5 dark:text-amber-400",
            )}
          >
            <Clock className="size-4" />
            <span>
              {pendingCount} {t("pending")}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
