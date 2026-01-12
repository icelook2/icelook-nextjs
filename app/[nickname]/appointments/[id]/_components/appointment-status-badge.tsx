import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { AppointmentStatus } from "@/lib/queries/appointments";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  {
    icon: typeof CheckCircle2;
    className: string;
    bgClassName: string;
  }
> = {
  completed: {
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    bgClassName: "bg-emerald-100 dark:bg-emerald-500/20",
  },
  cancelled: {
    icon: XCircle,
    className: "text-red-600 dark:text-red-400",
    bgClassName: "bg-red-100 dark:bg-red-500/20",
  },
  no_show: {
    icon: XCircle,
    className: "text-amber-600 dark:text-amber-400",
    bgClassName: "bg-amber-100 dark:bg-amber-500/20",
  },
  pending: {
    icon: Clock,
    className: "text-amber-600 dark:text-amber-400",
    bgClassName: "bg-amber-100 dark:bg-amber-500/20",
  },
  confirmed: {
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    bgClassName: "bg-emerald-100 dark:bg-emerald-500/20",
  },
};

interface AppointmentStatusProps {
  status: AppointmentStatus;
}

/** Full badge with background - for standalone display */
export async function AppointmentStatusBadge({
  status,
}: AppointmentStatusProps) {
  const t = await getTranslations("appointments");
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Translation keys are in format: status_pending, status_confirmed, etc.
  const statusKey = `status_${status}` as const;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5",
        config.bgClassName,
      )}
    >
      <Icon className={cn("h-4 w-4", config.className)} />
      <span className={cn("text-sm font-medium", config.className)}>
        {t(statusKey)}
      </span>
    </div>
  );
}

/** Simple colored label - for inline display in headers */
export async function AppointmentStatusLabel({
  status,
}: AppointmentStatusProps) {
  const t = await getTranslations("appointments");
  const config = STATUS_CONFIG[status];

  // Translation keys are in format: status_pending, status_confirmed, etc.
  const statusKey = `status_${status}` as const;

  return (
    <span className={cn("font-medium", config.className)}>{t(statusKey)}</span>
  );
}
