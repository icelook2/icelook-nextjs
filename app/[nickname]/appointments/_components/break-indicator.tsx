"use client";

import { Coffee } from "lucide-react";
import { formatBreakDuration } from "../_lib/workday-utils";

interface BreakIndicatorProps {
  /** Duration of the break in minutes */
  durationMinutes: number;
  /** Minimum duration to show the indicator (default: 5 minutes) */
  minDuration?: number;
}

/**
 * Visual break indicator shown between appointments
 *
 * Features:
 * - Only renders if break is longer than minDuration
 * - Shows coffee icon with duration text
 * - Dashed border styling for visual separation
 */
export function BreakIndicator({
  durationMinutes,
  minDuration = 5,
}: BreakIndicatorProps) {
  // Don't show for very short breaks
  if (durationMinutes < minDuration) {
    return null;
  }

  const breakText = formatBreakDuration(durationMinutes);

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="h-px flex-1 border-t border-dashed border-border" />
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Coffee className="h-3 w-3" />
        <span>{breakText}</span>
      </div>
      <div className="h-px flex-1 border-t border-dashed border-border" />
    </div>
  );
}
