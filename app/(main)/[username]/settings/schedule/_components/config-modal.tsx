"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ScheduleConfig, SlotDuration } from "@/lib/schedule/types";
import { SLOT_DURATIONS } from "@/lib/schedule/types";
import { Button } from "@/lib/ui/button";
import { Select } from "@/lib/ui/select";
import { updateScheduleConfig } from "../_actions/config.action";

interface ConfigModalProps {
  specialistId: string;
  config: ScheduleConfig;
  onClose: () => void;
  onSaved: (config: ScheduleConfig) => void;
}

// Common timezones for Ukraine and surrounding regions
const TIMEZONES = [
  { value: "Europe/Kyiv", label: "Kyiv (UTC+2/+3)" },
  { value: "Europe/Warsaw", label: "Warsaw (UTC+1/+2)" },
  { value: "Europe/Bucharest", label: "Bucharest (UTC+2/+3)" },
  { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)" },
  { value: "Europe/London", label: "London (UTC+0/+1)" },
  { value: "UTC", label: "UTC" },
];

export function ConfigModal({
  specialistId,
  config,
  onClose,
  onSaved,
}: ConfigModalProps) {
  const t = useTranslations("schedule");
  const [isPending, startTransition] = useTransition();

  const [timezone, setTimezone] = useState(config.timezone);
  const [slotDuration, setSlotDuration] = useState<SlotDuration>(
    config.default_slot_duration,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);

    startTransition(async () => {
      const result = await updateScheduleConfig(specialistId, {
        timezone,
        defaultSlotDuration: slotDuration,
      });

      if (result.success) {
        onSaved({
          ...config,
          timezone,
          default_slot_duration: slotDuration,
        });
      } else {
        setError(result.error ?? t("save_failed"));
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md m-4">
        {/* Header */}
        <div className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t("settings")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              {t("timezone")}
            </label>
            <p className="text-xs text-foreground/50 mb-2">
              {t("timezone_description")}
            </p>
            <Select.Root value={timezone} onValueChange={setTimezone}>
              <Select.Trigger />
              <Select.Content>
                {TIMEZONES.map((tz) => (
                  <Select.Item key={tz.value} value={tz.value}>
                    {tz.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          {/* Slot Duration */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              {t("slot_duration")}
            </label>
            <p className="text-xs text-foreground/50 mb-2">
              {t("slot_duration_description")}
            </p>
            <Select.Root
              value={String(slotDuration)}
              onValueChange={(val) =>
                setSlotDuration(Number(val) as SlotDuration)
              }
            >
              <Select.Trigger />
              <Select.Content>
                {SLOT_DURATIONS.map((duration) => (
                  <Select.Item key={duration} value={String(duration)}>
                    {duration} {t("minutes")}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={isPending} className="flex-1">
              {t("save")}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
