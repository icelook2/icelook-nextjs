"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { NumberField } from "@/lib/ui/number-field";
import { Select } from "@/lib/ui/select";
import { createService } from "../_actions";
import { DEFAULT_DURATION, DURATION_OPTIONS } from "./constants";

// Default price in UAH (not cents)
const DEFAULT_PRICE = 500;

interface CreateServiceDialogProps {
  serviceGroupId: string;
  nickname: string;
  variant?: "primary" | "secondary";
}

const formSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  price: z.number().min(1).max(1_000_000), // price in UAH (1 - 1,000,000)
  durationMinutes: z.number().min(5),
});

type FormData = z.infer<typeof formSchema>;

export function CreateServiceDialog({
  serviceGroupId,
  nickname,
  variant = "secondary",
}: CreateServiceDialogProps) {
  const t = useTranslations("service_groups");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: DEFAULT_PRICE,
      durationMinutes: DEFAULT_DURATION,
    },
  });

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
      reset();
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    // Convert price from UAH to cents
    const priceCents = Math.round(data.price * 100);

    startTransition(async () => {
      const result = await createService({
        serviceGroupId,
        name: data.name,
        priceCents,
        durationMinutes: data.durationMinutes,
        nickname,
      });

      if (result.success) {
        setOpen(false);
        reset();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("add_service")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("create_service_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="create-service-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root>
              <Field.Label>{t("service_name_label")}</Field.Label>
              <Input
                type="text"
                placeholder={t("service_name_placeholder")}
                state={errors.name ? "error" : "default"}
                {...register("name")}
              />
              <Field.Error>{errors.name?.message}</Field.Error>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t("price_label")}</Field.Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <NumberField
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? 0)}
                    min={1}
                    max={1_000_000}
                    step={1}
                  />
                )}
              />
              <Field.Error>{errors.price?.message}</Field.Error>
            </Field.Root>

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
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="create-service-form" loading={isPending}>
            {t("create")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
