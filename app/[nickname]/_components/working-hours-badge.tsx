import { Circle } from "lucide-react";

interface WorkingHoursBadgeProps {
  isOpen: boolean;
  statusMessage: string;
}

/**
 * A subtle status badge showing working hours availability.
 *
 * Displays a colored dot (green when working, gray when closed) followed
 * by a casual status message like "Working until 20:00" or "Opens tomorrow at 10:00".
 */
export function WorkingHoursBadge({
  isOpen,
  statusMessage,
}: WorkingHoursBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Circle
        className={`h-2 w-2 ${
          isOpen
            ? "fill-green-500 text-green-500"
            : "fill-neutral-400 text-neutral-400 dark:fill-neutral-500 dark:text-neutral-500"
        }`}
      />
      <span className="text-muted">{statusMessage}</span>
    </div>
  );
}
