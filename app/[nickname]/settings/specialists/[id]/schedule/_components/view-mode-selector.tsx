"use client";

import { Select } from "@/lib/ui/select";
import { VIEW_MODE_CONFIG, type ViewMode } from "../_lib/types";

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Dropdown selector for schedule view mode
 */
export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as ViewMode)}>
      <Select.Trigger className="w-32" />
      <Select.Content>
        {(Object.keys(VIEW_MODE_CONFIG) as ViewMode[]).map((mode) => (
          <Select.Item key={mode} value={mode}>
            {VIEW_MODE_CONFIG[mode].label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
