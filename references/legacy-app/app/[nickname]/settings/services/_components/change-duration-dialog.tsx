"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { Service } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Select } from "@/lib/ui/select";
import { updateServiceDuration } from "../_actions";
import { DURATION_OPTIONS } from "./constants";

interface ChangeDurationDialogProps {
  service: Service;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  durationMinutes: z.number().min(5),
});

type FormData = z.infer<typeof formSchema>;

export function ChangeDurationDialog({
  service,
  nickname,
  open,
  onOpenChange,
}: ChangeDurationDialogProps) {
  const t = useTranslations("service_groups");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { durationMinutes: service.duration_minutes },
  });

  useEffect(() => {
    if (open) {
      reset({ durationMinutes: service.duration_minutes });
      setServerError(null);
    }
  }, [open, service.duration_minutes, reset]);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await updateServiceDuration({
        id: service.id,
        durationMinutes: data.durationMinutes,
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
          {t("change_duration_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="change-duration-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root>
              <Field.Label>{t("duration_label")}</Field.Label>
              <Controller
                name="durationMinutes"
                control={control}
                render={({ field }) => {
                  const items = DURATION_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }));
                  return (
                    <Select.Root
                      items={items}
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <Select.Trigger
                        items={items}
                        state={errors.durationMinutes ? "error" : "default"}
                      />
                      <Select.Content>
                        {DURATION_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  );
                }}
              />
              <Field.Error>{errors.durationMinutes?.message}</Field.Error>
            </Field.Root>

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </form>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="change-duration-form" loading={isPending}>
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
