"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { createBreak, deleteBreak, updateBreak } from "../_actions";
import { normalizeTime } from "../_lib/time-utils";
import type { WorkingDayBreak } from "../_lib/types";

interface BreakFormData {
  startTime: string;
  endTime: string;
}

interface BreakDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  workingDayId: string;
  breakData?: WorkingDayBreak;
  beautyPageId: string;
  nickname: string;
}

/**
 * Dialog for creating or editing breaks
 */
export function BreakDialog({
  open,
  onClose,
  mode,
  workingDayId,
  breakData,
  beautyPageId,
  nickname,
}: BreakDialogProps) {
  const t = useTranslations("schedule");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BreakFormData>({
    defaultValues: {
      startTime: breakData ? normalizeTime(breakData.start_time) : "12:00",
      endTime: breakData ? normalizeTime(breakData.end_time) : "13:00",
    },
  });

  function onSubmit(data: BreakFormData) {
    setServerError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string } | undefined;

      if (mode === "create") {
        result = await createBreak({
          workingDayId,
          beautyPageId,
          nickname,
          startTime: data.startTime,
          endTime: data.endTime,
        });
      } else if (breakData) {
        result = await updateBreak({
          id: breakData.id,
          workingDayId,
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
    if (!breakData) {
      return;
    }

    setServerError(null);
    startTransition(async () => {
      const result = await deleteBreak({
        id: breakData.id,
        workingDayId,
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
          {mode === "create" ? t("add_break_title") : t("edit_break_title")}
        </Dialog.Header>

        <Dialog.Body>
          <form
            id="break-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
              {t("delete_break")}
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
            <Button type="submit" form="break-form" loading={isPending}>
              {t("save")}
            </Button>
          </div>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
