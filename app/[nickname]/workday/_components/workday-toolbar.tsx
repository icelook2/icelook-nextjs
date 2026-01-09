"use client";

import { addDays, format, isToday, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/lib/ui/button";
import { Popover } from "@/lib/ui/popover";
import { SimpleDatePicker } from "../../settings/schedule/_components/simple-date-picker";

interface WorkdayToolbarProps {
  currentDate: Date;
}

export function WorkdayToolbar({ currentDate }: WorkdayToolbarProps) {
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

  return (
    <div className="mb-6 flex items-center justify-between">
      {/* Prominent date header - tappable to open calendar */}
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
              {!isToday(currentDate) && (
                <p className="text-sm text-muted">
                  {format(currentDate, "EEEE")}
                </p>
              )}
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
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          aria-label="Previous day"
          className="aspect-square p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          aria-label="Next day"
          className="aspect-square p-2"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
