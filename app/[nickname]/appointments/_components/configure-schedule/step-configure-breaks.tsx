"use client";

import { Plus, Trash2 } from "lucide-react";
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
 * Step 3: Configure breaks for weekdays and weekend (optional)
 */
export function StepConfigureBreaks() {
  const t = useTranslations("creator_schedule.configure_schedule_dialog");

  const {
    weekdayBreaks,
    weekdayHours,
    selectedDatesByWeekday,
    addBreak,
    removeBreak,
    updateBreak,
  } = useConfigureSchedule();

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

  // Get working hours for display - use first weekday's hours for the weekdays group
  const weekdayWorkingHours =
    selectedWeekdays.length > 0 ? weekdayHours.get(selectedWeekdays[0]) : null;
  const saturdayWorkingHours = weekdayHours.get(SATURDAY_INDEX);
  const sundayWorkingHours = weekdayHours.get(SUNDAY_INDEX);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("step_breaks.description")}</p>

      {selectedWeekdays.length > 0 && (
        <BreakGroupRow
          label={t("weekdays_label")}
          dateCount={weekdayDateCount}
          workingHours={
            weekdayWorkingHours
              ? `${weekdayWorkingHours.startTime} → ${weekdayWorkingHours.endTime}`
              : null
          }
          dayIndices={selectedWeekdays}
          weekdayBreaks={weekdayBreaks}
          addBreak={addBreak}
          removeBreak={removeBreak}
          updateBreak={updateBreak}
        />
      )}
      {hasSaturday && (
        <BreakGroupRow
          label={t("saturday_label")}
          dateCount={saturdayDateCount}
          workingHours={
            saturdayWorkingHours
              ? `${saturdayWorkingHours.startTime} → ${saturdayWorkingHours.endTime}`
              : null
          }
          dayIndices={[SATURDAY_INDEX]}
          weekdayBreaks={weekdayBreaks}
          addBreak={addBreak}
          removeBreak={removeBreak}
          updateBreak={updateBreak}
        />
      )}
      {hasSunday && (
        <BreakGroupRow
          label={t("sunday_label")}
          dateCount={sundayDateCount}
          workingHours={
            sundayWorkingHours
              ? `${sundayWorkingHours.startTime} → ${sundayWorkingHours.endTime}`
              : null
          }
          dayIndices={[SUNDAY_INDEX]}
          weekdayBreaks={weekdayBreaks}
          addBreak={addBreak}
          removeBreak={removeBreak}
          updateBreak={updateBreak}
        />
      )}
    </div>
  );
}

// ============================================================================
// Break Group Row Component (Weekdays / Weekend)
// ============================================================================

interface BreakGroupRowProps {
  label: string;
  dateCount: number;
  workingHours: string | null;
  dayIndices: number[];
  weekdayBreaks: Map<
    number,
    {
      weekday: number;
      weekdayName: string;
      breaks: Array<{ id: string; startTime: string; endTime: string }>;
    }
  >;
  addBreak: (weekday: number) => void;
  removeBreak: (weekday: number, breakId: string) => void;
  updateBreak: (
    weekday: number,
    breakId: string,
    startTime: string,
    endTime: string,
  ) => void;
}

function BreakGroupRow({
  label,
  dateCount,
  workingHours,
  dayIndices,
  weekdayBreaks,
  addBreak,
  removeBreak,
  updateBreak,
}: BreakGroupRowProps) {
  const t = useTranslations("creator_schedule.configure_schedule_dialog");
  const firstDayBreaks = weekdayBreaks.get(dayIndices[0]);

  if (!firstDayBreaks) {
    return null;
  }

  const handleAddBreak = () => {
    for (const dayIndex of dayIndices) {
      addBreak(dayIndex);
    }
  };

  const handleRemoveBreak = (breakIndex: number) => {
    for (const dayIndex of dayIndices) {
      const dayBreaks = weekdayBreaks.get(dayIndex);
      if (dayBreaks?.breaks[breakIndex]) {
        removeBreak(dayIndex, dayBreaks.breaks[breakIndex].id);
      }
    }
  };

  const handleTimeChange = (
    breakIndex: number,
    type: "start" | "end",
    value: string,
  ) => {
    for (const dayIndex of dayIndices) {
      const dayBreaks = weekdayBreaks.get(dayIndex);
      if (!dayBreaks || !dayBreaks.breaks[breakIndex]) {
        continue;
      }
      const brk = dayBreaks.breaks[breakIndex];
      if (type === "start") {
        let newEndTime = brk.endTime;
        // Auto-adjust end time if it's before the new start time
        if (timeToMinutes(brk.endTime) <= timeToMinutes(value)) {
          const nextValidEnd = TIME_OPTIONS.find(
            (opt) => timeToMinutes(opt.value as string) > timeToMinutes(value),
          );
          if (nextValidEnd) {
            newEndTime = nextValidEnd.value as string;
          }
        }
        updateBreak(dayIndex, brk.id, value, newEndTime);
      } else {
        updateBreak(dayIndex, brk.id, brk.startTime, value);
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Label with pill badges for working hours, count, and add button */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        {workingHours && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted">
            {workingHours}
          </span>
        )}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted">
          {dateCount}
        </span>
        <button
          type="button"
          onClick={handleAddBreak}
          className="ml-auto flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
          title={t("step_breaks.add_break")}
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Break rows or empty state */}
      {firstDayBreaks.breaks.length > 0 ? (
        <div className="space-y-2">
          {firstDayBreaks.breaks.map((brk, index) => {
            const startMinutes = timeToMinutes(brk.startTime);
            const endMinutes = timeToMinutes(brk.endTime);

            return (
              <div key={brk.id} className="flex items-center gap-2">
                <TimeSelect
                  value={brk.startTime}
                  onChange={(v) => handleTimeChange(index, "start", v)}
                  disabledAfter={endMinutes}
                />
                <span className="text-muted">→</span>
                <TimeSelect
                  value={brk.endTime}
                  onChange={(v) => handleTimeChange(index, "end", v)}
                  disabledBefore={startMinutes}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveBreak(index)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">{t("step_breaks.no_breaks")}</p>
      )}
    </div>
  );
}
