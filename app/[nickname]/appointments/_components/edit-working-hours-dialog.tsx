"use client";

import { format } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import {
  createWorkingDay,
  updateWorkingDay,
} from "../_actions/working-day.actions";
import { TimePicker } from "./time-picker";

const localeMap = { en: enUS, uk } as const;

interface WorkingDayInfo {
  id: string;
  startTime: string;
  endTime: string;
}

interface EditWorkingHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  workingDay: WorkingDayInfo | null;
  beautyPageId: string;
  nickname: string;
}

/**
 * Dialog for editing working hours for a specific day
 *
 * If the day is not yet configured as a working day, creates a new working day.
 * If it's already a working day, updates the existing hours.
 */
export function EditWorkingHoursDialog({
  open,
  onOpenChange,
  selectedDate,
  workingDay,
  beautyPageId,
  nickname,
}: EditWorkingHoursDialogProps) {
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Time state
  const [startTime, setStartTime] = useState(workingDay?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(workingDay?.endTime ?? "18:00");

  const isEditing = workingDay !== null;
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const formattedDate = format(selectedDate, "d MMMM", {
    locale: dateFnsLocale,
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStartTime(workingDay?.startTime ?? "09:00");
      setEndTime(workingDay?.endTime ?? "18:00");
      setServerError(null);
    }
  }, [open, workingDay]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  };

  const handleSubmit = () => {
    setServerError(null);

    // Validate
    if (startTime >= endTime) {
      setServerError("End time must be after start time");
      return;
    }

    startTransition(async () => {
      if (isEditing && workingDay) {
        const result = await updateWorkingDay({
          id: workingDay.id,
          beautyPageId,
          nickname,
          startTime,
          endTime,
        });

        if (result.success) {
          onOpenChange(false);
        } else {
          setServerError(result.error);
        }
      } else {
        const result = await createWorkingDay({
          beautyPageId,
          nickname,
          date: dateStr,
          startTime,
          endTime,
        });

        if (result.success) {
          onOpenChange(false);
        } else {
          setServerError(result.error);
        }
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="md">
        <Dialog.Header
          onClose={() => onOpenChange(false)}
          subtitle={formattedDate}
        >
          {isEditing
            ? t("edit_hours.title_edit")
            : t("edit_hours.title_configure")}
        </Dialog.Header>
        <Dialog.Body>
          <TimePicker
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
          />

          {serverError && (
            <p className="mt-4 text-sm text-danger">{serverError}</p>
          )}
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("edit_hours.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {t("edit_hours.save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
