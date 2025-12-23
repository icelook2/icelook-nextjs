"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
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
  specialistId: string;
  beautyPageId: string;
  nickname: string;
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
  specialistId,
  beautyPageId,
  nickname,
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
          specialistId,
          beautyPageId,
          nickname,
          date,
          startTime: data.startTime,
          endTime: data.endTime,
        });
      } else if (mode === "edit" && workingDay) {
        result = await updateWorkingDay({
          id: workingDay.id,
          specialistId,
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
        specialistId,
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
          <div className="flex gap-2 ml-auto">
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
