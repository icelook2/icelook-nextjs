"use client";

import { Select, type SelectItem } from "@/lib/ui/select";

// ============================================================================
// Shared Types & Utilities
// ============================================================================

export interface TimePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

// Generate time options with 30-minute intervals
function generateTimeOptions(): SelectItem[] {
  const options: SelectItem[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      options.push({ value, label: value });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// ============================================================================
// Time Picker with Two Selects
// ============================================================================

export function TimePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimePickerProps) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const handleStartTimeChange = (value: unknown) => {
    if (value === null || typeof value !== "string") {
      return;
    }
    onStartTimeChange(value);

    // If current end time is now invalid, adjust it
    if (timeToMinutes(endTime) <= timeToMinutes(value)) {
      const newStartMinutes = timeToMinutes(value);
      const nextValidEnd = TIME_OPTIONS.find(
        (opt) => timeToMinutes(opt.value as string) > newStartMinutes,
      );
      if (nextValidEnd) {
        onEndTimeChange(nextValidEnd.value as string);
      }
    }
  };

  const handleEndTimeChange = (value: unknown) => {
    if (value === null || typeof value !== "string") {
      return;
    }
    onEndTimeChange(value);
  };

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Start time
        </label>
        <Select.Root
          value={startTime}
          onValueChange={handleStartTimeChange}
          items={TIME_OPTIONS}
        >
          <Select.Trigger items={TIME_OPTIONS} />
          <Select.Content>
            {TIME_OPTIONS.map((option) => {
              const optionMinutes = timeToMinutes(option.value as string);
              // Disable start times that would be >= current end time
              const isDisabled = optionMinutes >= endMinutes;

              return (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={isDisabled}
                >
                  {option.label}
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Root>
      </div>

      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium text-muted">
          End time
        </label>
        <Select.Root
          value={endTime}
          onValueChange={handleEndTimeChange}
          items={TIME_OPTIONS}
        >
          <Select.Trigger items={TIME_OPTIONS} />
          <Select.Content>
            {TIME_OPTIONS.map((option) => {
              const optionMinutes = timeToMinutes(option.value as string);
              // Disable end times that would be <= current start time
              const isDisabled = optionMinutes <= startMinutes;

              return (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={isDisabled}
                >
                  {option.label}
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  );
}
