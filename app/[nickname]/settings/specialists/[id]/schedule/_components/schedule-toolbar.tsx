"use client";

import { cn } from "@/lib/utils/cn";
import type { ViewMode } from "../_lib/types";
import { DateNavigator } from "./date-navigator";
import { DatePickerButton } from "./date-picker-button";
import { ViewModeSelector } from "./view-mode-selector";

interface ScheduleToolbarProps {
  viewMode: ViewMode;
  currentDate: Date;
  dates: Date[];
  onViewModeChange: (mode: ViewMode) => void;
  onDateChange: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}

/**
 * Toolbar with navigation controls and view mode selector
 */
export function ScheduleToolbar({
  viewMode,
  currentDate,
  dates,
  onViewModeChange,
  onDateChange,
  onPrevious,
  onNext,
  onToday,
  className,
}: ScheduleToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-4 py-3",
        className,
      )}
    >
      {/* Left side: Navigation */}
      <div className="flex items-center gap-2">
        <DateNavigator
          onPrevious={onPrevious}
          onNext={onNext}
          onToday={onToday}
        />

        <DatePickerButton
          dates={dates}
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      </div>

      {/* Right side: View mode */}
      <ViewModeSelector value={viewMode} onChange={onViewModeChange} />
    </div>
  );
}
