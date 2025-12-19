"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  generateSlotsFromWorkingDay,
  normalizeDbTime,
} from "@/lib/schedule/time-utils";
import type {
  SlotDuration,
  TimeRange,
  WorkingDayWithBreaks,
} from "@/lib/schedule/types";
import { Button } from "@/lib/ui/button";
import {
  deleteWorkingDay,
  upsertWorkingDay,
} from "../_actions/working-days.action";
import { DayTimeline } from "./day-timeline";
import { WorkingDayForm } from "./working-day-form";

interface DayDetailProps {
  specialistId: string;
  date: string | null;
  workingDay: WorkingDayWithBreaks | null;
  slotDuration: SlotDuration;
  onUpdate: () => void;
}

export function DayDetail({
  specialistId,
  date,
  workingDay,
  slotDuration,
  onUpdate,
}: DayDetailProps) {
  const t = useTranslations("schedule");
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Empty state - no date selected
  if (!date) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-foreground/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
        <Calendar className="h-12 w-12 text-foreground/20 mb-4" />
        <p className="text-foreground/60">{t("select_date")}</p>
      </div>
    );
  }

  const formattedDate = format(parseISO(date), "EEEE, MMMM d, yyyy");

  // Handle delete
  const handleDelete = () => {
    if (!confirm(t("delete_confirm"))) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteWorkingDay(specialistId, date);
      if (!result.success) {
        setError(result.error);
      } else {
        onUpdate();
      }
    });
  };

  // Handle save from form
  const handleSave = (data: {
    startTime: string;
    endTime: string;
    breaks: TimeRange[];
  }) => {
    setError(null);
    startTransition(async () => {
      const result = await upsertWorkingDay(specialistId, {
        date,
        startTime: data.startTime,
        endTime: data.endTime,
        breaks: data.breaks,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setIsEditing(false);
        onUpdate();
      }
    });
  };

  // Day off state - no working day for this date
  if (!workingDay) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-foreground/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{formattedDate}</h3>
            <p className="text-sm text-foreground/60">{t("day_off")}</p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {isEditing ? (
          <WorkingDayForm
            initialData={null}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isLoading={isPending}
          />
        ) : (
          <Button onClick={() => setIsEditing(true)} className="w-full">
            {t("make_working_day")}
          </Button>
        )}
      </div>
    );
  }

  // Working day state
  const startTime = normalizeDbTime(workingDay.start_time);
  const endTime = normalizeDbTime(workingDay.end_time);
  const breaks: TimeRange[] = workingDay.working_day_breaks.map((b) => ({
    start: normalizeDbTime(b.start_time),
    end: normalizeDbTime(b.end_time),
  }));

  // Generate slots for timeline
  const slots = generateSlotsFromWorkingDay(workingDay, slotDuration);

  return (
    <div className="bg-white dark:bg-gray-900 border border-foreground/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{formattedDate}</h3>
          <div className="flex items-center gap-2 text-sm text-foreground/60 mt-1">
            <Clock className="h-4 w-4" />
            {startTime} - {endTime}
            {breaks.length > 0 && (
              <span className="text-foreground/40">
                ({breaks.length}{" "}
                {breaks.length === 1 ? t("break") : t("breaks")})
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {isEditing ? (
        <WorkingDayForm
          initialData={{ startTime, endTime, breaks }}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isLoading={isPending}
        />
      ) : (
        <>
          <DayTimeline slots={slots} />

          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            {t("edit")}
          </Button>
        </>
      )}
    </div>
  );
}
