"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Popover } from "@/lib/ui/popover";
import { cn } from "@/lib/utils/cn";

const localeMap = { en: enUS, uk } as const;

interface CalendarFilterProps {
  /** Array of dates in YYYY-MM-DD format that have appointments */
  appointmentDates: string[];
  /** Translations */
  translations: {
    weekdays: {
      mo: string;
      tu: string;
      we: string;
      th: string;
      fr: string;
      sa: string;
      su: string;
    };
    clearFilter: string;
  };
}

/**
 * Calendar filter button that opens a popover with a mini calendar.
 * Highlights dates that have appointments.
 * On date click, filters the page to show only appointments for that date.
 */
export function CalendarFilter({
  appointmentDates,
  translations,
}: CalendarFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  // Convert array to Set for fast lookup
  const appointmentDatesSet = new Set(appointmentDates);

  const selectedDateStr = searchParams.get("date");
  const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null;

  const [viewDate, setViewDate] = useState(selectedDate ?? new Date());
  const [isOpen, setIsOpen] = useState(false);

  // Generate calendar data
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDayKeys = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;

  function handleDateSelect(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/appointments?date=${dateStr}`);
    setIsOpen(false);
  }

  function handleClearFilter() {
    router.push("/appointments");
    setIsOpen(false);
  }

  const hasActiveFilter = !!selectedDateStr;

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          hasActiveFilter
            ? "bg-accent text-white"
            : "text-foreground hover:bg-accent-soft/50",
        )}
      >
        <CalendarDays className="h-5 w-5" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="w-72 p-4">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="rounded-lg p-1.5 transition-colors hover:bg-accent/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="font-medium">
              {format(viewDate, "LLLL yyyy", { locale: dateFnsLocale })}
            </span>

            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="rounded-lg p-1.5 transition-colors hover:bg-accent/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Week day headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekDayKeys.map((key) => (
              <div
                key={key}
                className="py-1 text-center text-xs font-medium text-muted"
              >
                {translations.weekdays[key]}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasAppointment = appointmentDatesSet.has(dateStr);

              if (!isCurrentMonth) {
                return <div key={day.toISOString()} />;
              }

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={!hasAppointment}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg px-1.5 py-1.5 text-sm transition-colors",
                    // Base state
                    !hasAppointment && "cursor-not-allowed text-muted/40",
                    // Has appointment
                    hasAppointment &&
                      !isSelected &&
                      "cursor-pointer text-foreground hover:bg-accent/10",
                    // Selected
                    isSelected && "bg-accent text-white",
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {/* Appointment indicator dot - uses flexbox instead of absolute positioning for iOS compatibility */}
                  <span
                    className={cn(
                      "mt-0.5 h-1 w-1 rounded-full",
                      hasAppointment && !isSelected && "bg-accent",
                      hasAppointment && isSelected && "bg-white",
                      !hasAppointment && "bg-transparent",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Clear filter button */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm text-muted transition-colors hover:bg-accent-soft/30 hover:text-foreground"
            >
              <X className="h-4 w-4" />
              {translations.clearFilter}
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
