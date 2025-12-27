"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { updateAssignment } from "../_actions";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parsePriceInput(value: string): number {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100);
}

interface EditPriceDialogProps {
  assignmentId: string;
  currentPriceCents: number;
  durationMinutes: number;
  serviceId: string;
  groupId: string;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  price: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val);
      return !Number.isNaN(num) && num >= 0 && num <= 100000;
    },
    { message: "Invalid price" },
  ),
});

type FormData = z.infer<typeof formSchema>;

export function EditPriceDialog({
  assignmentId,
  currentPriceCents,
  durationMinutes,
  serviceId,
  groupId,
  nickname,
  open,
  onOpenChange,
}: EditPriceDialogProps) {
  const t = useTranslations("service_groups");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { price: formatPrice(currentPriceCents) },
  });

  useEffect(() => {
    if (open) {
      reset({ price: formatPrice(currentPriceCents) });
      setServerError(null);
    }
  }, [open, currentPriceCents, reset]);

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
        priceCents: parsePriceInput(data.price),
        durationMinutes,
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
          {t("edit_price_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="edit-price-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
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

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
          </form>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="edit-price-form" loading={isPending}>
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
