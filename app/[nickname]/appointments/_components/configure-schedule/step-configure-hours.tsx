"use client";

import { useTranslations } from "next-intl";
import { useConfigureSchedule } from "./configure-schedule-context";
import {
  SATURDAY_INDEX,
  SUNDAY_INDEX,
  TIME_OPTIONS,
  TimeSelect,
  timeToMinutes,
  WEEKDAY_INDICES,
} from "./time-utils";

/**
 * Step 2: Configure working hours for weekdays and weekend
 */
export function StepConfigureHours() {
  const t = useTranslations("creator_schedule.configure_schedule_dialog");

  const { weekdayHours, selectedDatesByWeekday, setWeekdayHours, canProceed } =
    useConfigureSchedule();

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("step_hours.description")}</p>

      {selectedWeekdays.length > 0 && (
        <GroupRow
          label={t("weekdays_label")}
          dateCount={weekdayDateCount}
          dayIndices={selectedWeekdays}
          weekdayHours={weekdayHours}
          setWeekdayHours={setWeekdayHours}
        />
      )}
      {hasSaturday && (
        <GroupRow
          label={t("saturday_label")}
          dateCount={saturdayDateCount}
          dayIndices={[SATURDAY_INDEX]}
          weekdayHours={weekdayHours}
          setWeekdayHours={setWeekdayHours}
        />
      )}
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
        <p className="mt-2 text-sm text-danger">{t("error_invalid_hours")}</p>
      )}
    </div>
  );
}

// ============================================================================
// Group Row Component (Weekdays / Weekend)
// ============================================================================

interface GroupRowProps {
  label: string;
  dateCount: number;
  dayIndices: number[];
  weekdayHours: Map<
    number,
    { weekday: number; weekdayName: string; startTime: string; endTime: string }
  >;
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
        if (timeToMinutes(hours.endTime) <= timeToMinutes(value)) {
          const nextValidEnd = TIME_OPTIONS.find(
            (opt) => timeToMinutes(opt.value as string) > timeToMinutes(value),
          );
          if (nextValidEnd) {
            newEndTime = nextValidEnd.value as string;
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

  return (
    <div className="space-y-1">
      {/* Label with working days count badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted">
          {dateCount}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TimeSelect
          value={firstDayHours.startTime}
          onChange={(v) => handleGroupTimeChange("start", v)}
          disabledAfter={endMinutes}
        />
        <span className="text-muted">→</span>
        <TimeSelect
          value={firstDayHours.endTime}
          onChange={(v) => handleGroupTimeChange("end", v)}
          disabledBefore={startMinutes}
        />
      </div>
    </div>
  );
}
