import { Clock } from "lucide-react";
import type { OpenStatus } from "@/lib/utils/open-status";

interface OpenStatusBadgeProps {
  status: OpenStatus;
  /** "Open now" / "Closed" text */
  openText: string;
  closedText: string;
  /** "Closes at {time}" / "Opens at {time}" text */
  closesAtText?: string;
  opensAtText?: string;
}

export function OpenStatusBadge({
  status,
  openText,
  closedText,
  closesAtText,
  opensAtText,
}: OpenStatusBadgeProps) {
  if (status.isOpen) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <span>{openText}</span>
        {status.nextChangeTime && closesAtText && (
          <span className="text-green-600 dark:text-green-500">
            · {closesAtText.replace("{time}", status.nextChangeTime)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
      <Clock className="h-3.5 w-3.5" />
      <span>{closedText}</span>
      {status.nextChangeTime && opensAtText && (
        <span className="text-gray-500 dark:text-gray-500">
          · {opensAtText.replace("{time}", status.nextChangeTime)}
        </span>
      )}
    </div>
  );
}
