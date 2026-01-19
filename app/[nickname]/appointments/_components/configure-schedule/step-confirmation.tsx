"use client";

import {
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfWeek,
} from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { useConfigureSchedule } from "./configure-schedule-context";

const localeMap = { en: enUS, uk } as const;

// ============================================================================
// Types
// ============================================================================

interface BreakInfo {
  startTime: string;
  endTime: string;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  days: Array<{
    date: Date;
    dateStr: string;
    weekdayName: string;
    startTime: string;
    endTime: string;
    breaks: BreakInfo[];
  }>;
}

// ============================================================================
// Helper: Group dates by week
// ============================================================================

function groupDatesByWeek(
  selectedDates: Set<string>,
  weekdayHours: Map<
    number,
    { startTime: string; endTime: string; weekdayName: string }
  >,
  weekdayBreaks: Map<
    number,
    { breaks: Array<{ id: string; startTime: string; endTime: string }> }
  >,
): WeekData[] {
  const weeks = new Map<string, WeekData>();

  // Sort dates chronologically
  const sortedDates = Array.from(selectedDates).sort();

  for (const dateStr of sortedDates) {
    const date = parseISO(dateStr);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, "yyyy-MM-dd");

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, {
        weekStart,
        weekEnd: endOfWeek(date, { weekStartsOn: 1 }),
        weekNumber: weeks.size + 1,
        days: [],
      });
    }

    const jsWeekday = date.getDay();
    const ourWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1;
    const hours = weekdayHours.get(ourWeekday);
    const breaksData = weekdayBreaks.get(ourWeekday);

    if (hours) {
      weeks.get(weekKey)?.days.push({
        date,
        dateStr,
        weekdayName: hours.weekdayName,
        startTime: hours.startTime,
        endTime: hours.endTime,
        breaks:
          breaksData?.breaks.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
          })) || [],
      });
    }
  }

  return Array.from(weeks.values());
}

// ============================================================================
// Main Component
// ============================================================================

export function StepConfirmation() {
  const t = useTranslations("creator_schedule.configure_schedule_dialog");
  const tSchedule = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const { selectedDates, weekdayHours, weekdayBreaks, error } =
    useConfigureSchedule();

  // Group dates by week
  const weeks = groupDatesByWeek(selectedDates, weekdayHours, weekdayBreaks);

  // Weekday labels from translations
  const weekdayKeys = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t("step_confirm.description")}</p>

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Calendar grid view */}
      <div className="space-y-3">
        {weeks.map((week) => (
          <div
            key={week.weekNumber}
            className="overflow-hidden rounded-xl border border-border"
          >
            <div className="flex items-center justify-between bg-surface-secondary px-3 py-2">
              <span className="font-medium">
                {isSameMonth(week.weekStart, week.weekEnd)
                  ? format(week.weekStart, "LLLL", { locale: dateFnsLocale })
                  : `${format(week.weekStart, "LLLL", { locale: dateFnsLocale })} – ${format(week.weekEnd, "LLLL", { locale: dateFnsLocale })}`}
              </span>
              <span className="text-xs text-muted">
                {t("week", { number: week.weekNumber })}
              </span>
            </div>
            <div className="grid grid-cols-7 divide-x divide-border bg-surface">
              {weekdayKeys.map((key, i) => {
                const dayInWeek = week.days.find((day) => {
                  const jsWeekday = day.date.getDay();
                  return (jsWeekday === 0 ? 6 : jsWeekday - 1) === i;
                });
                return (
                  <div
                    key={key}
                    className={cn(
                      "p-2 text-center",
                      !dayInWeek && "opacity-30",
                    )}
                  >
                    <div className="text-[10px] text-muted">
                      {tSchedule(`weekdays.${key}`)}
                    </div>
                    {dayInWeek ? (
                      <>
                        <div className="text-sm font-bold text-emerald-400">
                          {format(dayInWeek.date, "d")}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted">
                          {dayInWeek.startTime}-
                        </div>
                        <div className="text-[10px] text-muted">
                          {dayInWeek.endTime}
                        </div>
                        {dayInWeek.breaks.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {dayInWeek.breaks.map((brk) => (
                              <div
                                key={`${brk.startTime}-${brk.endTime}`}
                                className="text-[10px] text-amber-400"
                              >
                                <div>{brk.startTime}-</div>
                                <div>{brk.endTime}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted/30">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
