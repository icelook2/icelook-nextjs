"use client";

import { Select, type SelectItem } from "@/lib/ui/select";

// ============================================================================
// Constants
// ============================================================================

// Weekday indices (Mon=0 to Sun=6 in our display order)
export const WEEKDAY_INDICES = [0, 1, 2, 3, 4]; // Mon-Fri
export const SATURDAY_INDEX = 5;
export const SUNDAY_INDEX = 6;

// ============================================================================
// Time Options
// ============================================================================

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

export const TIME_OPTIONS = generateTimeOptions();

// ============================================================================
// Helpers
// ============================================================================

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// ============================================================================
// Time Select Component
// ============================================================================

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabledBefore?: number;
  disabledAfter?: number;
}

export function TimeSelect({
  value,
  onChange,
  disabledBefore,
  disabledAfter,
}: TimeSelectProps) {
  const handleChange = (newValue: unknown) => {
    if (typeof newValue === "string") {
      onChange(newValue);
    }
  };

  return (
    <div className="flex-1">
      <Select.Root
        value={value}
        onValueChange={handleChange}
        items={TIME_OPTIONS}
      >
        <Select.Trigger
          items={TIME_OPTIONS}
          style={{ minHeight: 44, padding: "10px 12px" }}
        />
        <Select.Content>
          {TIME_OPTIONS.map((option) => {
            const optionMinutes = timeToMinutes(option.value as string);
            const isDisabled =
              (disabledBefore !== undefined &&
                optionMinutes <= disabledBefore) ||
              (disabledAfter !== undefined && optionMinutes >= disabledAfter);
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
  );
}
