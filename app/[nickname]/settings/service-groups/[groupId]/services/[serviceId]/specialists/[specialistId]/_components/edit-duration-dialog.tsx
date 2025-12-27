"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Select } from "@/lib/ui/select";
import { updateAssignment } from "../_actions";

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
];

interface EditDurationDialogProps {
  assignmentId: string;
  priceCents: number;
  currentDurationMinutes: number;
  serviceId: string;
  groupId: string;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  duration: z.number().min(15).max(480),
});

type FormData = z.infer<typeof formSchema>;

export function EditDurationDialog({
  assignmentId,
  priceCents,
  currentDurationMinutes,
  serviceId,
  groupId,
  nickname,
  open,
  onOpenChange,
}: EditDurationDialogProps) {
  const t = useTranslations("service_groups");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { duration: currentDurationMinutes },
  });

  useEffect(() => {
    if (open) {
      reset({ duration: currentDurationMinutes });
      setServerError(null);
    }
  }, [open, currentDurationMinutes, reset]);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await updateAssignment({
        id: assignmentId,
        priceCents,
        durationMinutes: data.duration,
        serviceId,
        groupId,
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
          {t("edit_duration_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="edit-duration-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root>
              <Field.Label>{t("duration_label")}</Field.Label>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    items={DURATION_OPTIONS}
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <Select.Trigger
                      state={errors.duration ? "error" : "default"}
                    />
                    <Select.Content>
                      {DURATION_OPTIONS.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
              <Field.Error>{errors.duration?.message}</Field.Error>
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
          <Button type="submit" form="edit-duration-form" loading={isPending}>
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
