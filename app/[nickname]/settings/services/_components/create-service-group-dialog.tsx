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
import { createServiceGroup } from "../_actions";

interface CreateServiceGroupDialogProps {
  beautyPageId: string;
  nickname: string;
  variant?: "primary" | "secondary";
}

const formSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateServiceGroupDialog({
  beautyPageId,
  nickname,
  variant = "secondary",
}: CreateServiceGroupDialogProps) {
  const t = useTranslations("service_groups");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
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

    startTransition(async () => {
      const result = await createServiceGroup({
        beautyPageId,
        name: data.name,
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
        {t("add_group")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("create_group_title")}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="create-service-group-form"
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
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="create-service-group-form"
            loading={isPending}
          >
            {t("create")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
