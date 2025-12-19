"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { compareTimes, generateTimeOptions } from "@/lib/schedule/time-utils";
import type { TimeRange } from "@/lib/schedule/types";
import { Button } from "@/lib/ui/button";
import { Select } from "@/lib/ui/select";

interface WorkingDayFormProps {
  initialData: {
    startTime: string;
    endTime: string;
    breaks: TimeRange[];
  } | null;
  onSave: (data: {
    startTime: string;
    endTime: string;
    breaks: TimeRange[];
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkingDayForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: WorkingDayFormProps) {
  const t = useTranslations("schedule");

  // Form state
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "18:00");
  const [breaks, setBreaks] = useState<TimeRange[]>(initialData?.breaks ?? []);
  const [error, setError] = useState<string | null>(null);

  // Generate time options
  const timeOptions = useMemo(() => generateTimeOptions(0, 24, 15), []);

  // Add a break
  const addBreak = () => {
    // Default break: 12:00 - 13:00 or middle of working hours
    const middleMinutes =
      (parseInt(startTime.split(":")[0], 10) +
        parseInt(endTime.split(":")[0], 10)) /
      2;
    const middleHour = Math.floor(middleMinutes);
    const breakStart = `${String(middleHour).padStart(2, "0")}:00`;
    const breakEnd = `${String(middleHour + 1).padStart(2, "0")}:00`;

    setBreaks([...breaks, { start: breakStart, end: breakEnd }]);
  };

  // Remove a break
  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  // Update a break
  const updateBreak = (
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setBreaks(
      breaks.map((br, i) => (i === index ? { ...br, [field]: value } : br)),
    );
  };

  // Validate and save
  const handleSave = () => {
    setError(null);

    // Validate working hours
    if (compareTimes(startTime, endTime) >= 0) {
      setError(t("error_end_before_start"));
      return;
    }

    // Validate breaks
    for (const br of breaks) {
      if (compareTimes(br.start, br.end) >= 0) {
        setError(t("error_break_end_before_start"));
        return;
      }

      if (
        compareTimes(br.start, startTime) < 0 ||
        compareTimes(br.end, endTime) > 0
      ) {
        setError(t("error_break_outside_hours"));
        return;
      }
    }

    // Check for overlapping breaks
    const sortedBreaks = [...breaks].sort((a, b) =>
      compareTimes(a.start, b.start),
    );
    for (let i = 0; i < sortedBreaks.length - 1; i++) {
      if (compareTimes(sortedBreaks[i].end, sortedBreaks[i + 1].start) > 0) {
        setError(t("error_breaks_overlap"));
        return;
      }
    }

    onSave({ startTime, endTime, breaks });
  };

  return (
    <div className="space-y-4">
      {/* Working hours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            {t("start_time")}
          </label>
          <Select.Root value={startTime} onValueChange={setStartTime}>
            <Select.Trigger placeholder={t("select_time")} />
            <Select.Content>
              {timeOptions.map((time) => (
                <Select.Item key={time} value={time}>
                  {time}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            {t("end_time")}
          </label>
          <Select.Root value={endTime} onValueChange={setEndTime}>
            <Select.Trigger placeholder={t("select_time")} />
            <Select.Content>
              {timeOptions.map((time) => (
                <Select.Item key={time} value={time}>
                  {time}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      {/* Breaks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground/70">
            {t("breaks")}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addBreak}
            disabled={breaks.length >= 10}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("add_break")}
          </Button>
        </div>

        {breaks.length === 0 ? (
          <p className="text-sm text-foreground/40 py-2">{t("no_breaks")}</p>
        ) : (
          <div className="space-y-2">
            {breaks.map((br, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select.Root
                  value={br.start}
                  onValueChange={(value) => updateBreak(index, "start", value)}
                >
                  <Select.Trigger className="flex-1" />
                  <Select.Content>
                    {timeOptions.map((time) => (
                      <Select.Item key={time} value={time}>
                        {time}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                <span className="text-foreground/40">-</span>

                <Select.Root
                  value={br.end}
                  onValueChange={(value) => updateBreak(index, "end", value)}
                >
                  <Select.Trigger className="flex-1" />
                  <Select.Content>
                    {timeOptions.map((time) => (
                      <Select.Item key={time} value={time}>
                        {time}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBreak(index)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} loading={isLoading} className="flex-1">
          {t("save")}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
