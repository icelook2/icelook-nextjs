"use client";

import { getDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Select } from "@/lib/ui/select";
import { createBeautyPageFlow } from "../_actions/create-beauty-page-flow.action";
import {
  DEFAULT_END_TIME,
  DEFAULT_START_TIME,
  SATURDAY_INDEX,
  SUNDAY_INDEX,
  TIME_OPTIONS,
  timeToMinutes,
  WEEKDAY_INDICES,
} from "../_lib/constants";
import {
  jsWeekdayToOurs,
  type StepProps,
  type WeekdayHoursData,
} from "../_lib/types";
import { HoursPreview } from "./previews";
import { SplitLayout } from "./split-layout";

/**
 * Weekday names for display
 */
const WEEKDAY_NAMES: Record<number, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

/**
 * Derive selected dates grouped by weekday
 */
function deriveSelectedDatesByWeekday(
  selectedDates: Set<string>,
): Map<number, string[]> {
  const result = new Map<number, string[]>();

  for (const dateStr of selectedDates) {
    const date = new Date(dateStr);
    const jsWeekday = getDay(date);
    const ourWeekday = jsWeekdayToOurs(jsWeekday);

    const existing = result.get(ourWeekday) || [];
    existing.push(dateStr);
    result.set(ourWeekday, existing);
  }

  return result;
}

/**
 * Step 4: Configure Working Hours
 *
 * Allows users to set working hours for each weekday group.
 * Hours are grouped by: Weekdays (Mon-Fri), Saturday, Sunday
 */
export function StepConfigureHours({
  state,
  onUpdate,
  onBack,
  onSkip,
}: StepProps) {
  const router = useRouter();
  const t = useTranslations("create_beauty_page.configure_hours");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedDates = state.selectedDates;
  const weekdayHours = state.weekdayHours;

  // Derive dates by weekday
  const selectedDatesByWeekday = deriveSelectedDatesByWeekday(selectedDates);

  // Initialize hours when entering this step
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only depends on selectedDates to initialize hours when dates change
  useEffect(() => {
    if (selectedDates.size === 0) {
      return;
    }

    const newHours = new Map(weekdayHours);
    let hasChanges = false;

    // Initialize hours for each weekday that has selected dates
    for (const [weekday, dates] of selectedDatesByWeekday) {
      if (!newHours.has(weekday) && dates.length > 0) {
        newHours.set(weekday, {
          weekday,
          weekdayName: WEEKDAY_NAMES[weekday],
          startTime: DEFAULT_START_TIME,
          endTime: DEFAULT_END_TIME,
        });
        hasChanges = true;
      }
    }

    // Remove hours for weekdays that no longer have selected dates
    for (const weekday of newHours.keys()) {
      if (!selectedDatesByWeekday.has(weekday)) {
        newHours.delete(weekday);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      onUpdate({ weekdayHours: newHours });
    }
  }, [selectedDates]);

  // Set hours for a weekday group
  const setWeekdayHours = (
    weekday: number,
    startTime: string,
    endTime: string,
  ) => {
    const newHours = new Map(weekdayHours);
    const existing = newHours.get(weekday);

    if (existing) {
      newHours.set(weekday, { ...existing, startTime, endTime });
      onUpdate({ weekdayHours: newHours });
    }
  };

  // Check which groups exist
  const selectedWeekdays = WEEKDAY_INDICES.filter((i) =>
    selectedDatesByWeekday.has(i),
  );
  const hasSaturday = selectedDatesByWeekday.has(SATURDAY_INDEX);
  const hasSunday = selectedDatesByWeekday.has(SUNDAY_INDEX);

  // Get date counts for each group
  const weekdayDateCount = selectedWeekdays.reduce(
    (sum, i) => sum + (selectedDatesByWeekday.get(i)?.length || 0),
    0,
  );
  const saturdayDateCount =
    selectedDatesByWeekday.get(SATURDAY_INDEX)?.length || 0;
  const sundayDateCount = selectedDatesByWeekday.get(SUNDAY_INDEX)?.length || 0;

  // Validation: all hours must be valid (start < end)
  const canProceed = (() => {
    for (const hours of weekdayHours.values()) {
      if (hours.startTime >= hours.endTime) {
        return false;
      }
    }
    return weekdayHours.size > 0;
  })();

  // Submit the beauty page
  const handleSubmit = () => {
    setError(null);

    // Convert state data to the format expected by the server action
    const servicesData = state.services.map((s) => ({
      name: s.name,
      priceCents: s.priceCents,
      durationMinutes: s.durationMinutes,
    }));

    const selectedDatesArray = Array.from(selectedDates);

    const weekdayHoursArray = Array.from(weekdayHours.values()).map((h) => ({
      weekday: h.weekday,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    startTransition(async () => {
      const result = await createBeautyPageFlow({
        name: state.name,
        nickname: state.nickname,
        services: servicesData,
        selectedDates: selectedDatesArray,
        weekdayHours: weekdayHoursArray,
      });

      if (result.success) {
        router.push(`/${result.nickname}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <SplitLayout
        title={t("title")}
        subtitle={t("subtitle")}
        form={
          <div className="space-y-6">
            <p className="text-sm text-muted">{t("description")}</p>

            {/* Weekdays group */}
            {selectedWeekdays.length > 0 && (
              <GroupRow
                label={t("weekdays_label")}
                dateCount={weekdayDateCount}
                dayIndices={selectedWeekdays}
                weekdayHours={weekdayHours}
                setWeekdayHours={setWeekdayHours}
              />
            )}

            {/* Saturday group */}
            {hasSaturday && (
              <GroupRow
                label={t("saturday_label")}
                dateCount={saturdayDateCount}
                dayIndices={[SATURDAY_INDEX]}
                weekdayHours={weekdayHours}
                setWeekdayHours={setWeekdayHours}
              />
            )}

            {/* Sunday group */}
            {hasSunday && (
              <GroupRow
                label={t("sunday_label")}
                dateCount={sundayDateCount}
                dayIndices={[SUNDAY_INDEX]}
                weekdayHours={weekdayHours}
                setWeekdayHours={setWeekdayHours}
              />
            )}

            {!canProceed && (
              <p className="text-sm text-danger">{t("error_invalid_hours")}</p>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        }
        preview={
          <HoursPreview
            weekdayHours={weekdayHours}
            selectedDates={selectedDates}
          />
        }
      />

      {/* Fixed bottom actions */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            {t("back")}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onSkip}>
              {t("skip")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canProceed}
              loading={isPending}
            >
              {t("create")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Group Row Component (Weekdays / Saturday / Sunday)
// ============================================================================

interface GroupRowProps {
  label: string;
  dateCount: number;
  dayIndices: number[];
  weekdayHours: Map<number, WeekdayHoursData>;
  setWeekdayHours: (
    weekday: number,
    startTime: string,
    endTime: string,
  ) => void;
}

function GroupRow({
  label,
  dateCount,
  dayIndices,
  weekdayHours,
  setWeekdayHours,
}: GroupRowProps) {
  const firstDayHours = weekdayHours.get(dayIndices[0]);

  if (!firstDayHours) {
    return null;
  }

  const handleGroupTimeChange = (type: "start" | "end", value: string) => {
    for (const dayIndex of dayIndices) {
      const hours = weekdayHours.get(dayIndex);
      if (!hours) {
        continue;
      }

      if (type === "start") {
        let newEndTime = hours.endTime;
        // Auto-adjust end time if it becomes invalid
        if (timeToMinutes(hours.endTime) <= timeToMinutes(value)) {
          const nextValidEnd = TIME_OPTIONS.find(
            (opt) => timeToMinutes(opt.value) > timeToMinutes(value),
          );
          if (nextValidEnd) {
            newEndTime = nextValidEnd.value;
          }
        }
        setWeekdayHours(dayIndex, value, newEndTime);
      } else {
        setWeekdayHours(dayIndex, hours.startTime, value);
      }
    }
  };

  const startMinutes = timeToMinutes(firstDayHours.startTime);
  const endMinutes = timeToMinutes(firstDayHours.endTime);

  const timeItems = TIME_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // Filter time options for start (must be before end)
  const startTimeItems = timeItems.filter(
    (item) => timeToMinutes(item.value) < endMinutes,
  );

  // Filter time options for end (must be after start)
  const endTimeItems = timeItems.filter(
    (item) => timeToMinutes(item.value) > startMinutes,
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      {/* Label with working days count badge */}
      <div className="flex items-center gap-2">
        <span className="font-medium">{label}</span>
        <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-muted">
          {dateCount}
        </span>
      </div>

      {/* Time selectors */}
      <div className="flex items-center gap-3">
        <Select.Root
          items={startTimeItems}
          value={firstDayHours.startTime}
          onValueChange={(v) => handleGroupTimeChange("start", v as string)}
        >
          <Select.Trigger items={startTimeItems} className="w-28" />
          <Select.Content>
            {startTimeItems.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <span className="text-muted">→</span>

        <Select.Root
          items={endTimeItems}
          value={firstDayHours.endTime}
          onValueChange={(v) => handleGroupTimeChange("end", v as string)}
        >
          <Select.Trigger items={endTimeItems} className="w-28" />
          <Select.Content>
            {endTimeItems.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  );
}
