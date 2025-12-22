"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Select } from "@/lib/ui/select";
import { updateAssignment } from "../_actions";
import { DURATION_OPTIONS, formatPrice, parsePriceInput } from "./constants";

interface EditAssignmentDialogProps {
  assignment: {
    id: string;
    price_cents: number;
    duration_minutes: number;
  };
  specialistName: string;
  serviceId: string;
  nickname: string;
}

const formSchema = z.object({
  price: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(480),
});

type FormData = z.infer<typeof formSchema>;

export function EditAssignmentDialog({
  assignment,
  specialistName,
  serviceId,
  nickname,
}: EditAssignmentDialogProps) {
  const t = useTranslations("services");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: formatPrice(assignment.price_cents),
      durationMinutes: assignment.duration_minutes,
    },
  });

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
      reset({
        price: formatPrice(assignment.price_cents),
        durationMinutes: assignment.duration_minutes,
      });
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    const priceCents = parsePriceInput(data.price);

    startTransition(async () => {
      const result = await updateAssignment({
        id: assignment.id,
        serviceId,
        priceCents,
        durationMinutes: data.durationMinutes,
        nickname,
      });

      if (result.success) {
        setOpen(false);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-0.5 transition-colors hover:"
      >
        <Pencil className="h-3 w-3" />
      </button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("edit_assignment_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="mb-4 text-sm text-">
            {t("edit_assignment_description", { specialist: specialistName })}
          </p>

          <form
            id="edit-assignment-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Field.Root>
                <Field.Label>{t("price_label")}</Field.Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  state={errors.price ? "error" : "default"}
                  {...register("price")}
                />
                <Field.Error>{errors.price?.message}</Field.Error>
              </Field.Root>

              <Field.Root>
                <Field.Label>{t("duration_label")}</Field.Label>
                <Controller
                  name="durationMinutes"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <Select.Trigger
                        state={errors.durationMinutes ? "error" : "default"}
                      />
                      <Select.Content>
                        {DURATION_OPTIONS.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
                <Field.Error>{errors.durationMinutes?.message}</Field.Error>
              </Field.Root>
            </div>

            {serverError && <p className="text-sm text-">{serverError}</p>}
          </form>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="edit-assignment-form" loading={isPending}>
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
