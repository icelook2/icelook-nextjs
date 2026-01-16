"use client";

import { CalendarCheck, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterType = "confirmed" | "pending" | null;

interface ScheduleFilterChipsProps {
  appointmentCount: number;
  pendingCount: number;
  isWorkingDay: boolean;
}

export function ScheduleFilterChips({
  appointmentCount,
  pendingCount,
  isWorkingDay,
}: ScheduleFilterChipsProps) {
  const t = useTranslations("creator_schedule");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilter = searchParams.get("filter") as FilterType;

  const setFilter = (filter: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === null || filter === currentFilter) {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!isWorkingDay) {
    return (
      <div className="flex">
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted shadow-sm">
          {t("day_off")}
        </span>
      </div>
    );
  }

  const confirmedCount = appointmentCount - pendingCount;
  const appointmentLabel = confirmedCount === 1 ? t("appointment") : t("appointments");

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setFilter("confirmed")}
        className={
          currentFilter === "confirmed"
            ? "flex items-center gap-1.5 rounded-full border border-accent bg-accent px-3 py-1.5 text-white shadow-sm transition-colors"
            : "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-muted shadow-sm transition-colors hover:border-accent/50"
        }
      >
        <CalendarCheck className="size-4" />
        <span>
          {confirmedCount} {appointmentLabel}
        </span>
      </button>

      {pendingCount > 0 && (
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={
            currentFilter === "pending"
              ? "flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500 px-3 py-1.5 text-white shadow-sm transition-colors dark:border-amber-400 dark:bg-amber-400 dark:text-black"
              : "flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500/15 px-3 py-1.5 text-amber-600 shadow-sm transition-colors hover:bg-amber-500/25 dark:border-amber-400 dark:bg-amber-400/15 dark:text-amber-400 dark:hover:bg-amber-400/25"
          }
        >
          <Clock className="size-4" />
          <span>
            {pendingCount} {t("pending")}
          </span>
        </button>
      )}
    </div>
  );
}
