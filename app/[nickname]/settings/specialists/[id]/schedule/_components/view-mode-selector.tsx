"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Select } from "@/lib/ui/select";
import type { ViewMode } from "../_lib/types";

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Dropdown selector for schedule view mode
 */
export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  const t = useTranslations("schedule");

  const viewModeItems = useMemo(
    () => [
      { value: "week" as const, label: t("view_week") },
      { value: "7days" as const, label: t("view_7days") },
      { value: "3days" as const, label: t("view_3days") },
      { value: "day" as const, label: t("view_day") },
    ],
    [t],
  );

  return (
    <Select.Root
      items={viewModeItems}
      value={value}
      onValueChange={(v) => onChange(v as ViewMode)}
    >
      <Select.Trigger className="w-32" />
      <Select.Content>
        {viewModeItems.map((mode) => (
          <Select.Item key={mode.value} value={mode.value}>
            {mode.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
