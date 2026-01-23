"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Service } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { updateService } from "../_actions";

interface EditServiceDialogProps {
  service: Service;
  groupId: string;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditServiceDialog({
  service,
  groupId,
  nickname,
  open,
  onOpenChange,
}: EditServiceDialogProps) {
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
    defaultValues: { name: service.name, description: service.description ?? "" },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({ name: service.name, description: service.description ?? "" });
      setServerError(null);
    }
  }, [open, service.name, service.description, reset]);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await updateService({
        id: service.id,
        name: data.name,
        description: data.description,
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
          {t("edit_service_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="edit-service-form"
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
              <Field.Label>{t("service_description_label")}</Field.Label>
              <Textarea
                placeholder={t("service_description_placeholder")}
                rows={3}
                state={errors.description ? "error" : "default"}
                {...register("description")}
              />
              <Field.Description>{t("service_description_hint")}</Field.Description>
              <Field.Error>{errors.description?.message}</Field.Error>
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
          <Button type="submit" form="edit-service-form" loading={isPending}>
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
