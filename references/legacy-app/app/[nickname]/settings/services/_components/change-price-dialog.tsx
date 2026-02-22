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
import { NumberField } from "@/lib/ui/number-field";
import { updateServicePrice } from "../_actions";

interface ChangePriceDialogProps {
  service: Service;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  price: z.number().min(1).max(1_000_000),
});

type FormData = z.infer<typeof formSchema>;

export function ChangePriceDialog({
  service,
  nickname,
  open,
  onOpenChange,
}: ChangePriceDialogProps) {
  const t = useTranslations("service_groups");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Convert cents to UAH for the form
  const priceInUah = service.price_cents / 100;

  const {
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { price: priceInUah },
  });

  useEffect(() => {
    if (open) {
      reset({ price: service.price_cents / 100 });
      setServerError(null);
    }
  }, [open, service.price_cents, reset]);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    // Convert UAH to cents
    const priceCents = Math.round(data.price * 100);

    startTransition(async () => {
      const result = await updateServicePrice({
        id: service.id,
        priceCents,
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
          {t("change_price_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="change-price-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
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

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </form>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="change-price-form" loading={isPending}>
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
