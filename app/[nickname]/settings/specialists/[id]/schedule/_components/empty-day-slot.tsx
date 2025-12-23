"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

interface EmptyDaySlotProps {
  date: Date;
  onClick?: () => void;
  canManage: boolean;
  className?: string;
}

/**
 * Empty state for a day with no working hours
 * Shows a button to add working hours
 */
export function EmptyDaySlot({
  onClick,
  canManage,
  className,
}: EmptyDaySlotProps) {
  const t = useTranslations("schedule");

  if (!canManage) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center text-muted",
          className,
        )}
      >
        <p className="text-sm">{t("no_hours_set")}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2",
        "text-muted transition-colors hover:bg-accent/5 hover:text-foreground",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-current">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-sm">{t("add_working_hours")}</span>
    </button>
  );
}
