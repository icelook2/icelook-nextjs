"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

const statusStyles: Record<AppointmentStatus, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  confirmed:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  no_show: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations("appointments");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {t(`status_${status}`)}
    </span>
  );
}
