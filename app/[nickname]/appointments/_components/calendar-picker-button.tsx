"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useId, useState } from "react";
import { Popover } from "@/lib/ui/popover";
import { cn } from "@/lib/utils/cn";
import { SimpleDatePicker } from "./simple-date-picker";

interface CalendarPickerButtonProps {
  selectedDate: Date;
}

/**
 * Calendar icon button with date picker popover
 * Used in the page header for date selection
 */
export function CalendarPickerButton({
  selectedDate,
}: CalendarPickerButtonProps) {
  const id = useId();
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

  const handleDateSelect = (date: Date) => {
    navigateToDate(date);
    setPickerOpen(false);
  };

  return (
    <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
      <Popover.Trigger
        id={id}
        render={
          <button
            type="button"
            className={cn(
              "rounded-lg p-2 transition-colors",
              "hover:bg-accent/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            )}
            aria-label="Open calendar"
          >
            <Calendar className="h-5 w-5 text-accent" />
          </button>
        }
      />
      <Popover.Portal>
        <Popover.Content align="end" className="p-4">
          <SimpleDatePicker
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
