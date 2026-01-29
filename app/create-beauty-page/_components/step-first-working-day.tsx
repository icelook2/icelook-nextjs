"use client";

import { format, isBefore, startOfDay } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { CalendarDays, Coffee, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { SimpleDatePicker } from "@/app/[nickname]/appointments/_components/simple-date-picker";
import { Button } from "@/lib/ui/button";
import { Popover } from "@/lib/ui/popover";
import { Select } from "@/lib/ui/select";
import {
  DEFAULT_END_TIME,
  DEFAULT_START_TIME,
  TIME_OPTIONS,
  timeToMinutes,
} from "../_lib/constants";
import type { BreakTimeData, FirstWorkingDayData } from "../_lib/types";
import { BookingPreview } from "./previews/booking-preview";
import { StepLayout } from "./step-layout";

const localeMap = { en: enUS, uk } as const;

// Default break times
const DEFAULT_BREAK_START = "13:00";
const DEFAULT_BREAK_END = "14:00";

interface StepFirstWorkingDayProps {
  firstWorkingDay: FirstWorkingDayData | null;
  totalSteps: number;
  onUpdate: (firstWorkingDay: FirstWorkingDayData | null) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

/**
 * Step 6: Configure First Working Day
 *
 * Compact step to set up the first working day:
 * - Select a date (via popover)
 * - Set start/end times
 * - Optional break time
 */
export function StepFirstWorkingDay({
  firstWorkingDay,
  totalSteps,
  onUpdate,
  onNext,
  onPrevious,
  onSkip,
}: StepFirstWorkingDayProps) {
  const t = useTranslations("create_beauty_page");
  const tStep = useTranslations("create_beauty_page.first_working_day");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;

  const today = startOfDay(new Date());

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    firstWorkingDay ? new Date(firstWorkingDay.date) : null,
  );
  const [startTime, setStartTime] = useState(
    firstWorkingDay?.startTime ?? DEFAULT_START_TIME,
  );
  const [endTime, setEndTime] = useState(
    firstWorkingDay?.endTime ?? DEFAULT_END_TIME,
  );
  const [breakTime, setBreakTime] = useState<BreakTimeData | null>(
    firstWorkingDay?.breakTime ?? null,
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Update parent state
  const updateParent = (
    date: Date | null,
    start: string,
    end: string,
    breakData: BreakTimeData | null,
  ) => {
    if (date) {
      onUpdate({
        date: format(date, "yyyy-MM-dd"),
        startTime: start,
        endTime: end,
        breakTime: breakData ?? undefined,
      });
    } else {
      onUpdate(null);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (isBefore(date, today)) return;
    setSelectedDate(date);
    setCalendarOpen(false);
    updateParent(date, startTime, endTime, breakTime);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    let newEndTime = endTime;
    if (timeToMinutes(endTime) <= timeToMinutes(value)) {
      const nextValid = TIME_OPTIONS.find(
        (opt) => timeToMinutes(opt.value) > timeToMinutes(value),
      );
      if (nextValid) {
        newEndTime = nextValid.value;
        setEndTime(newEndTime);
      }
    }
    updateParent(selectedDate, value, newEndTime, breakTime);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    updateParent(selectedDate, startTime, value, breakTime);
  };

  const handleAddBreak = () => {
    const newBreak = { startTime: DEFAULT_BREAK_START, endTime: DEFAULT_BREAK_END };
    setBreakTime(newBreak);
    updateParent(selectedDate, startTime, endTime, newBreak);
  };

  const handleRemoveBreak = () => {
    setBreakTime(null);
    updateParent(selectedDate, startTime, endTime, null);
  };

  const handleBreakStartChange = (value: string) => {
    if (!breakTime) return;
    let newBreakEnd = breakTime.endTime;
    if (timeToMinutes(breakTime.endTime) <= timeToMinutes(value)) {
      const nextValid = TIME_OPTIONS.find(
        (opt) => timeToMinutes(opt.value) > timeToMinutes(value),
      );
      if (nextValid) {
        newBreakEnd = nextValid.value;
      }
    }
    const newBreak = { startTime: value, endTime: newBreakEnd };
    setBreakTime(newBreak);
    updateParent(selectedDate, startTime, endTime, newBreak);
  };

  const handleBreakEndChange = (value: string) => {
    if (!breakTime) return;
    const newBreak = { ...breakTime, endTime: value };
    setBreakTime(newBreak);
    updateParent(selectedDate, startTime, endTime, newBreak);
  };

  // Validation
  const isValid =
    selectedDate !== null && timeToMinutes(endTime) > timeToMinutes(startTime);

  // Filter time options
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const startTimeItems = TIME_OPTIONS.filter(
    (item) => timeToMinutes(item.value) < endMinutes,
  );
  const endTimeItems = TIME_OPTIONS.filter(
    (item) => timeToMinutes(item.value) > startMinutes,
  );

  // Break time filters (must be within working hours)
  const breakStartItems = TIME_OPTIONS.filter((item) => {
    const mins = timeToMinutes(item.value);
    return mins > startMinutes && mins < endMinutes - 30; // At least 30min before end
  });
  const breakEndItems = TIME_OPTIONS.filter((item) => {
    const mins = timeToMinutes(item.value);
    const breakStartMins = breakTime ? timeToMinutes(breakTime.startTime) : 0;
    return mins > breakStartMins && mins < endMinutes;
  });

  // Format selected date for display
  const formattedDate = selectedDate
    ? format(selectedDate, "EEEE, d MMMM", { locale: dateFnsLocale })
    : null;

  return (
    <StepLayout
      currentStep={6}
      totalSteps={totalSteps}
      title={tStep("title")}
      subtitle={tStep("subtitle")}
      previewLabel={t("preview.label")}
      preview={<BookingPreview firstWorkingDay={firstWorkingDay} />}
      onBack={onPrevious}
    >
      <div className="space-y-5" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Date selection - compact button with popover */}
        <div className="space-y-2" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label className="text-sm font-medium">{tStep("select_date")}</label>
          <Popover.Root open={calendarOpen} onOpenChange={setCalendarOpen}>
            <Popover.Trigger
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left"
            >
              <CalendarDays className="size-5 text-muted" />
              <span className={selectedDate ? "text-text" : "text-muted"}>
                {formattedDate ?? tStep("select_date")}
              </span>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content align="start" className="p-3">
                <SimpleDatePicker
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                  minDate={today}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>

        {/* Working hours - only show after date is selected */}
        {selectedDate && (
          <>
            <div className="space-y-2" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label className="text-sm font-medium">{tStep("working_hours")}</label>
              <div className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Select.Root
                  items={startTimeItems}
                  value={startTime}
                  onValueChange={(v) => handleStartTimeChange(v as string)}
                >
                  <Select.Trigger items={startTimeItems} className="flex-1" />
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
                  value={endTime}
                  onValueChange={(v) => handleEndTimeChange(v as string)}
                >
                  <Select.Trigger items={endTimeItems} className="flex-1" />
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

            {/* Break time (optional) */}
            <div className="space-y-2" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {breakTime ? (
                <>
                  <div className="flex items-center justify-between" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label className="text-sm font-medium">{tStep("break_time")}</label>
                    <button
                      type="button"
                      onClick={handleRemoveBreak}
                      className="text-xs text-muted hover:text-danger"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Select.Root
                      items={breakStartItems}
                      value={breakTime.startTime}
                      onValueChange={(v) => handleBreakStartChange(v as string)}
                    >
                      <Select.Trigger items={breakStartItems} className="flex-1" />
                      <Select.Content>
                        {breakStartItems.map((item) => (
                          <Select.Item key={item.value} value={item.value}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>

                    <span className="text-muted">→</span>

                    <Select.Root
                      items={breakEndItems}
                      value={breakTime.endTime}
                      onValueChange={(v) => handleBreakEndChange(v as string)}
                    >
                      <Select.Trigger items={breakEndItems} className="flex-1" />
                      <Select.Content>
                        {breakEndItems.map((item) => (
                          <Select.Item key={item.value} value={item.value}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleAddBreak}
                  className="flex items-center gap-2 text-sm text-muted hover:text-text"
                >
                  <Coffee className="size-4" />
                  {tStep("add_break")}
                </button>
              )}
            </div>
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 pt-2" style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.5rem" }}>
          {isValid ? (
            <Button onClick={onNext}>{t("navigation.continue")}</Button>
          ) : (
            <Button variant="ghost" onClick={onSkip}>
              {t("navigation.skip")}
            </Button>
          )}
        </div>
      </div>
    </StepLayout>
  );
}
