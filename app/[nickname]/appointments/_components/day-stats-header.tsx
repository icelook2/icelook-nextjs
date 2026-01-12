"use client";

import { addDays, format, isToday, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/lib/ui/button";
import { Popover } from "@/lib/ui/popover";
import { SimpleDatePicker } from "./simple-date-picker";

interface DayStatsHeaderProps {
  currentDate: Date;
  appointmentCount: number;
  totalEarningsCents: number;
  currency: string;
  /** Hide the stats line (for past/completed days where "expected" doesn't make sense) */
  hideStats?: boolean;
}

/**
 * Header component showing date navigation and day statistics
 *
 * Features:
 * - Date display with day navigation arrows
 * - Tappable date opens calendar picker
 * - Day stats: "X appointments · ₴Y,YYY expected"
 */
export function DayStatsHeader({
  currentDate,
  appointmentCount,
  totalEarningsCents,
  currency,
  hideStats = false,
}: DayStatsHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);

  const navigateToDate = useCallback(
    (date: Date) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", format(date, "yyyy-MM-dd"));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const goToPrevious = () => navigateToDate(subDays(currentDate, 1));
  const goToNext = () => navigateToDate(addDays(currentDate, 1));

  const handleDateSelect = (date: Date) => {
    navigateToDate(date);
    setPickerOpen(false);
  };

  // Format date for prominent display
  const dateDisplay = isToday(currentDate)
    ? "Today"
    : format(currentDate, "MMMM d");

  // Format earnings
  const formattedEarnings = formatCurrency(totalEarningsCents, currency);

  // Build stats string
  const statsText =
    appointmentCount > 0
      ? `${appointmentCount} appointment${appointmentCount !== 1 ? "s" : ""} · ${formattedEarnings} expected`
      : "No appointments";

  return (
    <div className="mb-6">
      {/* Date header with navigation */}
      <div className="flex items-center justify-between">
        {/* Date display - clickable to open calendar */}
        <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
          <Popover.Trigger
            render={
              <button
                type="button"
                className="cursor-pointer text-left focus-visible:outline-offset-2"
              >
                <h2 className="text-2xl font-semibold text-foreground">
                  {dateDisplay}
                </h2>
                <p className="text-sm text-muted">
                  {format(currentDate, "EEEE")}
                </p>
              </button>
            }
          />
          <Popover.Portal>
            <Popover.Content className="p-4">
              <SimpleDatePicker
                selectedDate={currentDate}
                onSelect={handleDateSelect}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Navigation arrows */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={goToPrevious}
            aria-label="Previous day"
            className="aspect-square p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={goToNext}
            aria-label="Next day"
            className="aspect-square p-2"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Day statistics - hidden for past/completed days */}
      {!hideStats && <p className="mt-1 text-sm text-muted">{statsText}</p>}
    </div>
  );
}

/**
 * Format currency for display
 * Converts cents to main unit and adds currency symbol
 */
function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;

  // Currency symbols mapping
  const symbols: Record<string, string> = {
    UAH: "₴",
    USD: "$",
    EUR: "€",
    GBP: "£",
    PLN: "zł",
  };

  const symbol = symbols[currency] ?? currency;

  // Format with thousands separator
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${symbol}${formatted}`;
}
