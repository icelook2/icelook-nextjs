"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  TimeSelect,
  timeToMinutes,
} from "@/app/[nickname]/appointments/_components/configure-schedule/time-utils";
import type { Service } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Switch } from "@/lib/ui/switch";
import { updateServiceTimeWindow } from "../_actions";

interface SetTimeWindowDialogProps {
  service: Service;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z
  .object({
    enabled: z.boolean(),
    fromTime: z.string(),
    toTime: z.string(),
  })
  .refine(
    (data) => {
      if (!data.enabled) {
        return true;
      }
      return timeToMinutes(data.fromTime) < timeToMinutes(data.toTime);
    },
    { message: "End time must be after start time", path: ["toTime"] },
  );

type FormData = z.infer<typeof formSchema>;

export function SetTimeWindowDialog({
  service,
  nickname,
  open,
  onOpenChange,
}: SetTimeWindowDialogProps) {
  const t = useTranslations("service_groups");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const hasExistingWindow =
    !!service.available_from_time && !!service.available_to_time;

  const {
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: hasExistingWindow,
      fromTime: service.available_from_time?.slice(0, 5) ?? "08:00",
      toTime: service.available_to_time?.slice(0, 5) ?? "18:00",
    },
  });

  const enabled = watch("enabled");
  const fromTime = watch("fromTime");

  useEffect(() => {
    if (open) {
      reset({
        enabled: hasExistingWindow,
        fromTime: service.available_from_time?.slice(0, 5) ?? "08:00",
        toTime: service.available_to_time?.slice(0, 5) ?? "18:00",
      });
      setServerError(null);
    }
  }, [open, service, hasExistingWindow, reset]);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await updateServiceTimeWindow({
        id: service.id,
        availableFromTime: data.enabled ? data.fromTime : null,
        availableToTime: data.enabled ? data.toTime : null,
        nickname,
      });

      if (result.success) {
        onOpenChange(false);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t("set_time_window_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="set-time-window-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root direction="row" className="justify-between">
              <div>
                <Field.Label>{t("time_window_enabled_label")}</Field.Label>
                <Field.Description>
                  {t("time_window_enabled_description")}
                </Field.Description>
              </div>
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field.Root>

            {enabled && (
              <div className="flex gap-3">
                <Field.Root className="flex-1">
                  <Field.Label>{t("available_from_label")}</Field.Label>
                  <Controller
                    name="fromTime"
                    control={control}
                    render={({ field }) => (
                      <TimeSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field.Root>

                <Field.Root className="flex-1">
                  <Field.Label>{t("available_to_label")}</Field.Label>
                  <Controller
                    name="toTime"
                    control={control}
                    render={({ field }) => (
                      <TimeSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabledBefore={timeToMinutes(fromTime)}
                      />
                    )}
                  />
                  <Field.Error>{errors.toTime?.message}</Field.Error>
                </Field.Root>
              </div>
            )}

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </form>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="set-time-window-form" loading={isPending}>
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
