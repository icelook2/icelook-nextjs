"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, Clock } from "lucide-react";
import type { DayHours } from "@/lib/queries/beauty-page-profile";
import { Paper } from "@/lib/ui/paper";

interface HoursSectionProps {
  businessHours: DayHours[];
  timezone: string;
  translations: {
    title: string;
    today: string;
    closed: string;
    seeFullSchedule: string;
    dayNames: string[];
  };
}

/**
 * Get current day of week in the business's timezone.
 */
function getCurrentDayOfWeek(timezone: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weekday = formatter.format(now);
  return weekdayMap[weekday] ?? 0;
}

/**
 * Format time from "HH:MM:SS" to "HH:MM".
 */
function formatTime(time: string | null): string {
  if (!time) {
    return "";
  }
  return time.slice(0, 5);
}

export function HoursSection({
  businessHours,
  timezone,
  translations,
}: HoursSectionProps) {
  const currentDay = getCurrentDayOfWeek(timezone);

  // Create a map for quick lookup
  const hoursMap = new Map<number, DayHours>();
  for (const hours of businessHours) {
    hoursMap.set(hours.day_of_week, hours);
  }

  // Get today's hours
  const todayHours = hoursMap.get(currentDay);
  const todayDisplay = todayHours?.is_open
    ? `${formatTime(todayHours.open_time)} – ${formatTime(todayHours.close_time)}`
    : translations.closed;

  // Generate all days starting from Monday (1)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">{translations.title}</h2>

      <Paper>
        <Collapsible.Root>
          {/* Today's hours - always visible */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted">{translations.today}</div>
                <div className="font-medium">{todayDisplay}</div>
              </div>
            </div>
          </div>

          {/* Toggle for full schedule */}
          <Collapsible.Trigger className="group flex w-full items-center justify-center gap-1 border-t border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
            <span>{translations.seeFullSchedule}</span>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[panel-open]:rotate-180" />
          </Collapsible.Trigger>

          {/* Full schedule */}
          <Collapsible.Panel className="overflow-hidden border-t border-border transition-all duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0">
            <div className="divide-y divide-border">
              {orderedDays.map((dayOfWeek) => {
                const dayHours = hoursMap.get(dayOfWeek);
                const isToday = dayOfWeek === currentDay;
                const dayName = translations.dayNames[dayOfWeek];

                const hoursDisplay = dayHours?.is_open
                  ? `${formatTime(dayHours.open_time)} – ${formatTime(dayHours.close_time)}`
                  : translations.closed;

                return (
                  <div
                    key={dayOfWeek}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      isToday ? "bg-accent-soft/50" : ""
                    }`}
                  >
                    <span className={isToday ? "font-medium" : ""}>
                      {dayName}
                      {isToday && (
                        <span className="ml-2 text-xs text-accent">
                          ({translations.today})
                        </span>
                      )}
                    </span>
                    <span
                      className={`${
                        dayHours?.is_open ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {hoursDisplay}
                    </span>
                  </div>
                );
              })}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      </Paper>
    </section>
  );
}
