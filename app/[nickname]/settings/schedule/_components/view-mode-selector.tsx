"use client";

import { useTranslations } from "next-intl";
import { Select } from "@/lib/ui/select";
import type { ViewMode } from "../_lib/types";

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const VIEW_MODES: ViewMode[] = ["week", "7days", "3days", "day"];

/**
 * Dropdown selector for schedule view mode
 */
export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  const t = useTranslations("schedule");

  const getLabel = (mode: ViewMode) => {
    switch (mode) {
      case "week":
        return t("view_week");
      case "7days":
        return t("view_7days");
      case "3days":
        return t("view_3days");
      case "day":
        return t("view_day");
    }
  };

  const items = VIEW_MODES.map((mode) => ({
    value: mode,
    label: getLabel(mode),
  }));

  return (
    <Select.Root
      items={items}
      value={value}
      onValueChange={(v) => onChange(v as ViewMode)}
    >
      <Select.Trigger items={items} className="w-32" />
      <Select.Content>
        {VIEW_MODES.map((mode) => (
          <Select.Item key={mode} value={mode}>
            {getLabel(mode)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
