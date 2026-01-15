"use client";

import { Plus } from "lucide-react";
import { Paper } from "@/lib/ui/paper";

interface FreeSlotProps {
  startTime: string;
  durationMinutes: number;
  onBook?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Current variant (baseline)
 * Time | Plus circle | Available slot text
 */
export function FreeSlotMutedPaper({
  startTime,
  durationMinutes,
  onBook,
}: FreeSlotProps) {
  const time = startTime.slice(0, 5);
  const duration = formatDuration(durationMinutes);

  return (
    <button type="button" onClick={onBook} className="w-full text-left">
      <Paper className="p-4 bg-surface/60 transition-colors hover:bg-surface dark:bg-surface/60 dark:hover:bg-surface">
        <div className="flex items-center gap-3">
          <span className="w-12 text-lg font-semibold text-foreground">
            {time}
          </span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-500 dark:border-emerald-400">
            <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Available slot</p>
            <p className="text-sm text-muted">{duration}</p>
          </div>
        </div>
      </Paper>
    </button>
  );
}

/**
 * Available slot card for future days
 * Green dashed circle with plus icon, "Available slot" text with time and duration
 */
export function AvailableSlot({
  startTime,
  durationMinutes,
  onBook,
}: FreeSlotProps) {
  const time = startTime.slice(0, 5);
  const duration = formatDuration(durationMinutes);

  return (
    <button type="button" onClick={onBook} className="w-full text-left">
      <Paper className="p-4 bg-surface/60 transition-colors hover:bg-surface dark:bg-surface/60 dark:hover:bg-surface">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-500 dark:border-emerald-400">
            <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Available slot</p>
            <p className="text-sm text-muted">
              {time} · {duration}
            </p>
          </div>
        </div>
      </Paper>
    </button>
  );
}

// ============================================
// Past Empty Slot (for historical view)
// Shows slots that were NOT booked on past days
// ============================================

interface PastEmptySlotProps {
  startTime: string;
}

/**
 * Past empty slot - "No appointment" style
 * Simple and clean, shows time with dimmed "No appointment" text
 */
export function PastEmptySlot({ startTime }: PastEmptySlotProps) {
  const time = startTime.slice(0, 5);

  return (
    <Paper className="p-4 opacity-50">
      <div className="flex items-center gap-3">
        <span className="w-12 text-lg font-semibold text-foreground">
          {time}
        </span>
        <p className="text-muted">No appointment</p>
      </div>
    </Paper>
  );
}
