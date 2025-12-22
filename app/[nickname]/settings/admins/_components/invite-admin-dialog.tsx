"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { inviteAdmin } from "../_actions";

interface InviteAdminDialogProps {
  beautyPageId: string;
  nickname: string;
}

const formSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

type FormData = z.infer<typeof formSchema>;

export function InviteAdminDialog({
  beautyPageId,
  nickname,
}: InviteAdminDialogProps) {
  const t = useTranslations("admins");
  const tValidation = useTranslations("validation");
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
    defaultValues: {
      email: "",
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

    startTransition(async () => {
      const result = await inviteAdmin({
        beautyPageId,
        email: data.email,
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
      <Button onClick={() => setOpen(true)} size="sm">
        <UserPlus className="mr-2 h-4 w-4" />
        {t("invite_button")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("invite_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="mb-4 text-sm text-">{t("invite_description")}</p>

          <form
            id="invite-admin-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root>
              <Field.Label>{t("email_label")}</Field.Label>
              <Input
                type="email"
                placeholder={t("email_placeholder")}
                state={errors.email ? "error" : "default"}
                {...register("email")}
              />
              <Field.Error>
                {errors.email?.message && tValidation("email_invalid")}
              </Field.Error>
            </Field.Root>

            {serverError && <p className="text-sm text-">{serverError}</p>}
          </form>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="invite-admin-form" loading={isPending}>
            {t("send_invite")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
