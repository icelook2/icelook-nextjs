"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { createLabel } from "../_actions";
import { ColorPicker } from "./color-picker";

interface CreateLabelDialogProps {
  beautyPageId: string;
  nickname: string;
  variant?: "primary" | "secondary";
}

const formSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateLabelDialog({
  beautyPageId,
  nickname,
  variant = "secondary",
}: CreateLabelDialogProps) {
  const t = useTranslations("labels");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", color: null },
  });

  const selectedColor = watch("color");

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
      reset();
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await createLabel({
        beautyPageId,
        name: data.name,
        color: data.color,
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
        {t("add_label")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("create_label_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="create-label-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root>
              <Field.Label>{t("name_label")}</Field.Label>
              <Input
                type="text"
                placeholder={t("name_placeholder")}
                state={errors.name ? "error" : "default"}
                {...register("name")}
              />
              <Field.Error>{errors.name?.message}</Field.Error>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t("color_label")}</Field.Label>
              <Field.Description>{t("color_hint")}</Field.Description>
              <ColorPicker
                value={selectedColor}
                onChange={(color) => setValue("color", color)}
              />
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
          <Button type="submit" form="create-label-form" loading={isPending}>
            {t("create")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
