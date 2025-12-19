"use client";

import { addMonths, format } from "date-fns";
import { Calendar, List, Plus, Repeat, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { compareTimes, generateTimeOptions } from "@/lib/schedule/time-utils";
import type { DayOfWeek, PatternType, TimeRange } from "@/lib/schedule/types";
import { DAY_OF_WEEK_LABELS } from "@/lib/schedule/types";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Select } from "@/lib/ui/select";
import {
  generateWorkingDaysFromPattern,
  previewPatternGeneration,
} from "../_actions/generate.action";
import type { SchedulePatternFormData } from "../schemas";

interface PatternGeneratorModalProps {
  specialistId: string;
  onClose: () => void;
  onGenerated: () => void;
}

type TabType = PatternType;

export function PatternGeneratorModal({
  specialistId,
  onClose,
  onGenerated,
}: PatternGeneratorModalProps) {
  const t = useTranslations("schedule");
  const [isPending, startTransition] = useTransition();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("weekly");

  // Common form state
  const today = new Date();
  const nextMonth = addMonths(today, 1);
  const [startDate, setStartDate] = useState(format(today, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(nextMonth, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breaks, setBreaks] = useState<TimeRange[]>([
    { start: "12:00", end: "13:00" },
  ]);

  // Rotation-specific state
  const [daysOn, setDaysOn] = useState(5);
  const [daysOff, setDaysOff] = useState(2);

  // Weekly-specific state
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    1, 2, 3, 4, 5,
  ]); // Mon-Fri

  // Bulk-specific state
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Preview state
  const [preview, setPreview] = useState<{
    totalDays: number;
    newDays: number;
    existingDays: number;
  } | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Time options
  const timeOptions = useMemo(() => generateTimeOptions(0, 24, 15), []);

  // Build pattern data
  const buildPattern = (): SchedulePatternFormData | null => {
    const workingHours = {
      start: startTime,
      end: endTime,
      breaks,
    };

    switch (activeTab) {
      case "rotation":
        return {
          type: "rotation",
          startDate,
          endDate,
          daysOn,
          daysOff,
          workingHours,
        };
      case "weekly":
        if (selectedDays.length === 0) {
          setError(t("error_select_days"));
          return null;
        }
        return {
          type: "weekly",
          startDate,
          endDate,
          workingDays: selectedDays,
          workingHours,
        };
      case "bulk":
        if (selectedDates.length === 0) {
          setError(t("error_select_dates"));
          return null;
        }
        return {
          type: "bulk",
          startDate,
          endDate,
          dates: selectedDates,
          workingHours,
        };
      default:
        return null;
    }
  };

  // Preview pattern
  const handlePreview = () => {
    setError(null);

    // Validate times
    if (compareTimes(startTime, endTime) >= 0) {
      setError(t("error_end_before_start"));
      return;
    }

    const pattern = buildPattern();
    if (!pattern) {
      return;
    }

    startTransition(async () => {
      const result = await previewPatternGeneration(specialistId, pattern);
      if (result.success && result.data) {
        setPreview(result.data);
      } else {
        setError(result.error ?? t("preview_failed"));
      }
    });
  };

  // Generate schedule
  const handleGenerate = () => {
    setError(null);

    const pattern = buildPattern();
    if (!pattern) {
      return;
    }

    startTransition(async () => {
      const result = await generateWorkingDaysFromPattern(
        specialistId,
        pattern,
        {
          overwriteExisting: true,
        },
      );

      if (result.success) {
        onGenerated();
      } else {
        setError(result.error ?? t("generation_failed"));
      }
    });
  };

  // Toggle day selection (weekly pattern)
  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  // Add break
  const addBreak = () => {
    setBreaks([...breaks, { start: "15:00", end: "15:15" }]);
  };

  // Remove break
  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  // Update break
  const updateBreak = (
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setBreaks(
      breaks.map((br, i) => (i === index ? { ...br, [field]: value } : br)),
    );
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
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-foreground/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t("generate_schedule")}
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
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === "weekly" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("weekly")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {t("weekly")}
            </Button>
            <Button
              variant={activeTab === "rotation" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("rotation")}
            >
              <Repeat className="h-4 w-4 mr-1" />
              {t("rotation")}
            </Button>
            <Button
              variant={activeTab === "bulk" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("bulk")}
            >
              <List className="h-4 w-4 mr-1" />
              {t("bulk")}
            </Button>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">
                {t("start_date")}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">
                {t("end_date")}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Pattern-specific options */}
          {activeTab === "rotation" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">
                  {t("days_on")}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={daysOn}
                  onChange={(e) => setDaysOn(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">
                  {t("days_off")}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={daysOff}
                  onChange={(e) => setDaysOff(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
          )}

          {activeTab === "weekly" && (
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                {t("working_days")}
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(DAY_OF_WEEK_LABELS) as [string, string][]).map(
                  ([dayNum, dayKey]) => {
                    const day = parseInt(dayNum, 10) as DayOfWeek;
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-violet-500 text-white"
                            : "bg-foreground/10 text-foreground/70 hover:bg-foreground/15"
                        }`}
                      >
                        {t(`day_${dayKey}`)}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {activeTab === "bulk" && (
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                {t("selected_dates")} ({selectedDates.length})
              </label>
              <p className="text-sm text-foreground/50 mb-2">
                {t("bulk_hint")}
              </p>
              <Input
                type="date"
                onChange={(e) => {
                  const date = e.target.value;
                  if (date && !selectedDates.includes(date)) {
                    setSelectedDates([...selectedDates, date].sort());
                  }
                  e.target.value = "";
                }}
              />
              {selectedDates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedDates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-foreground/10 rounded text-xs"
                    >
                      {format(new Date(date), "MMM d")}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDates(
                            selectedDates.filter((d) => d !== date),
                          )
                        }
                        className="text-foreground/40 hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Working hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">
                {t("start_time")}
              </label>
              <Select.Root value={startTime} onValueChange={setStartTime}>
                <Select.Trigger />
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
                <Select.Trigger />
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
              <p className="text-sm text-foreground/40">{t("no_breaks")}</p>
            ) : (
              <div className="space-y-2">
                {breaks.map((br, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select.Root
                      value={br.start}
                      onValueChange={(value) =>
                        updateBreak(index, "start", value)
                      }
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
                      onValueChange={(value) =>
                        updateBreak(index, "end", value)
                      }
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

          {/* Preview */}
          {preview && (
            <div className="bg-foreground/5 rounded-lg p-4 space-y-2">
              <p className="font-medium text-foreground">
                {t("preview_title")}
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-foreground/50">{t("total_days")}</p>
                  <p className="font-semibold text-foreground">
                    {preview.totalDays}
                  </p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("new_days")}</p>
                  <p className="font-semibold text-green-600">
                    {preview.newDays}
                  </p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("existing_days")}</p>
                  <p className="font-semibold text-amber-600">
                    {preview.existingDays}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handlePreview}
              loading={isPending}
              className="flex-1"
            >
              {t("preview")}
            </Button>
            <Button
              onClick={handleGenerate}
              loading={isPending}
              className="flex-1"
            >
              {t("generate")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
