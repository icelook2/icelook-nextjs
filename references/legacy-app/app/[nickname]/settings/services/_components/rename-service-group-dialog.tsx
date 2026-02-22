"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ServiceGroup } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { renameServiceGroup } from "../_actions";

interface RenameServiceGroupDialogProps {
  serviceGroup: ServiceGroup;
  beautyPageId: string;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

type FormData = z.infer<typeof formSchema>;

export function RenameServiceGroupDialog({
  serviceGroup,
  beautyPageId,
  nickname,
  open,
  onOpenChange,
}: RenameServiceGroupDialogProps) {
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
    defaultValues: { name: serviceGroup.name },
  });

  useEffect(() => {
    if (open) {
      reset({ name: serviceGroup.name });
      setServerError(null);
    }
  }, [open, serviceGroup.name, reset]);

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await renameServiceGroup({
        id: serviceGroup.id,
        name: data.name,
        beautyPageId,
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
          {t("rename_group_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="rename-service-group-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root>
              <Field.Label>{t("group_name_label")}</Field.Label>
              <Input
                type="text"
                placeholder={t("group_name_placeholder")}
                state={errors.name ? "error" : "default"}
                {...register("name")}
              />
              <Field.Error>{errors.name?.message}</Field.Error>
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
          <Button
            type="submit"
            form="rename-service-group-form"
            loading={isPending}
          >
            {t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
