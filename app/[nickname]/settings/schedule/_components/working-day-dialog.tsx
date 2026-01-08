"use client";

import { Ban, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { normalizeTime as formatTime } from "../_lib/time-utils";
import {
  createWorkingDay,
  deleteWorkingDay,
  updateWorkingDay,
} from "../_actions";
import { parseDate } from "../_lib/date-utils";
import { normalizeTime } from "../_lib/time-utils";
import type { WorkingDayWithBreaks } from "../_lib/types";

interface WorkingDayFormData {
  startTime: string;
  endTime: string;
}

interface WorkingDayDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  date?: string;
  workingDay?: WorkingDayWithBreaks;
  beautyPageId: string;
  nickname: string;
  onAddBreak?: (workingDayId: string) => void;
}

/**
 * Dialog for creating or editing working days
 */
export function WorkingDayDialog({
  open,
  onClose,
  mode,
  date,
  workingDay,
  beautyPageId,
  nickname,
  onAddBreak,
}: WorkingDayDialogProps) {
  const t = useTranslations("schedule");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkingDayFormData>({
    defaultValues: {
      startTime: workingDay ? normalizeTime(workingDay.start_time) : "09:00",
      endTime: workingDay ? normalizeTime(workingDay.end_time) : "18:00",
    },
  });

  const displayDate =
    mode === "create" && date
      ? parseDate(date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : workingDay
        ? parseDate(workingDay.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "";

  function onSubmit(data: WorkingDayFormData) {
    setServerError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string } | undefined;

      if (mode === "create" && date) {
        result = await createWorkingDay({
          beautyPageId,
          nickname,
          date,
          startTime: data.startTime,
          endTime: data.endTime,
        });
      } else if (mode === "edit" && workingDay) {
        result = await updateWorkingDay({
          id: workingDay.id,
          beautyPageId,
          nickname,
          startTime: data.startTime,
          endTime: data.endTime,
        });
      }

      if (result?.success) {
        onClose();
        router.refresh();
      } else {
        setServerError(result?.error ?? "An error occurred");
      }
    });
  }

  function handleDelete() {
    if (!workingDay) {
      return;
    }

    setServerError(null);
    startTransition(async () => {
      const result = await deleteWorkingDay({
        id: workingDay.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal open={open}>
        <Dialog.Header onClose={onClose}>
          {mode === "create" ? t("add_working_hours") : t("edit_working_hours")}
        </Dialog.Header>

        <Dialog.Body>
          <form
            id="working-day-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Date display */}
            <div className="rounded-lg bg-surface p-3">
              <p className="text-sm text-muted">{t("select_date")}</p>
              <p className="font-medium">{displayDate}</p>
            </div>

            {/* Start time */}
            <Field.Root>
              <Field.Label>{t("start_time")}</Field.Label>
              <Input
                type="time"
                {...register("startTime", {
                  required: "Start time is required",
                })}
                state={errors.startTime ? "error" : "default"}
              />
              {errors.startTime && (
                <Field.Error>{errors.startTime.message}</Field.Error>
              )}
            </Field.Root>

            {/* End time */}
            <Field.Root>
              <Field.Label>{t("end_time")}</Field.Label>
              <Input
                type="time"
                {...register("endTime", { required: "End time is required" })}
                state={errors.endTime ? "error" : "default"}
              />
              {errors.endTime && (
                <Field.Error>{errors.endTime.message}</Field.Error>
              )}
            </Field.Root>

            {/* Breaks section - only in edit mode */}
            {mode === "edit" && workingDay && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t("breaks")}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onAddBreak?.(workingDay.id);
                    }}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t("add_break")}
                  </Button>
                </div>

                {workingDay.breaks.length > 0 ? (
                  <div className="space-y-1">
                    {workingDay.breaks.map((breakItem) => (
                      <div
                        key={breakItem.id}
                        className="flex items-center gap-2 rounded-lg bg-surface-alt p-2 text-sm"
                      >
                        <Ban className="h-4 w-4 text-muted" />
                        <span className="text-muted">
                          {formatTime(breakItem.start_time)} –{" "}
                          {formatTime(breakItem.end_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">{t("no_breaks")}</p>
                )}
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </form>
        </Dialog.Body>

        <Dialog.Footer className="justify-between">
          {mode === "edit" && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isPending}
            >
              {t("delete_working_day")}
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" form="working-day-form" loading={isPending}>
              {t("save")}
            </Button>
          </div>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
