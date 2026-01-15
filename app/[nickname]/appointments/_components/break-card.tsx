"use client";

import { Coffee } from "lucide-react";
import { useState } from "react";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { cn } from "@/lib/utils/cn";
import type { WorkingDayBreak } from "../_lib/types";
import { BreakMenu } from "./break-menu";

interface BreakCardProps {
  breakItem: WorkingDayBreak;
  className?: string;
  /** Whether this break is currently active */
  isCurrent?: boolean;
  /** Whether this break is in the past (completed) */
  isPast?: boolean;
  /** Callback to end the break early (only shown for current breaks) */
  onEndBreak?: (breakId: string) => Promise<void>;
  /** Callback to edit the break (only shown for future breaks) */
  onEdit?: () => void;
  /** Callback to delete the break (only shown for future breaks) */
  onDelete?: () => void;
}

/**
 * Break card for the schedule view
 *
 * Displays scheduled breaks with the same card style as appointments.
 * The coffee icon and "Break" label differentiate it from appointments.
 * For current breaks, shows an "End Break" button.
 */
export function BreakCard({
  breakItem,
  className,
  isCurrent,
  isPast,
  onEndBreak,
  onEdit,
  onDelete,
}: BreakCardProps) {
  const [isEnding, setIsEnding] = useState(false);
  const startTime = breakItem.start_time.slice(0, 5);
  const endTime = breakItem.end_time.slice(0, 5);

  const handleEndBreak = async () => {
    if (!onEndBreak) {
      return;
    }
    setIsEnding(true);
    try {
      await onEndBreak(breakItem.id);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <Paper className={cn("p-4", className)}>
      <div className="flex items-center gap-3">
        {/* Coffee icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 dark:bg-amber-400/10">
          <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Break label and time range */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">
            Break{isCurrent && " (now)"}
          </p>
          <p className="truncate text-sm text-muted">
            {startTime} – {endTime}
          </p>
        </div>

        {/* End break button for current breaks */}
        {isCurrent && onEndBreak && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEndBreak}
            disabled={isEnding}
          >
            {isEnding ? "Ending..." : "End Break"}
          </Button>
        )}

        {/* Menu for future breaks (not current, not past) */}
        {!isCurrent && !isPast && onEdit && onDelete && (
          <BreakMenu onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>
    </Paper>
  );
}
