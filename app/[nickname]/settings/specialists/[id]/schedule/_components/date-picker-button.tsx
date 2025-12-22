"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/lib/ui/button";
import { Popover } from "@/lib/ui/popover";
import { formatDateRange, formatMonthYear } from "../_lib/date-utils";
import { SimpleDatePicker } from "./simple-date-picker";

interface DatePickerButtonProps {
  dates: Date[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

/**
 * Button that shows current date range and opens a date picker
 */
export function DatePickerButton({
  dates,
  currentDate,
  onDateChange,
}: DatePickerButtonProps) {
  const [open, setOpen] = useState(false);

  const displayText =
    dates.length === 1 ? formatMonthYear(dates[0]) : formatDateRange(dates);

  function handleDateSelect(date: Date) {
    onDateChange(date);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button variant="ghost" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{displayText}</span>
          </Button>
        }
      />
      <Popover.Content className="p-4">
        <SimpleDatePicker
          selectedDate={currentDate}
          onSelect={handleDateSelect}
        />
      </Popover.Content>
    </Popover.Root>
  );
}
