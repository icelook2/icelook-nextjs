"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { requestEmailChange } from "../_actions";
import { createTranslatedEmailSchema } from "../schemas";

interface EmailChangeFormProps {
  currentEmail: string;
  onSuccess: (newEmail: string) => void;
  onCancel: () => void;
}

export function EmailChangeForm({
  currentEmail,
  onSuccess,
  onCancel,
}: EmailChangeFormProps) {
  const t = useTranslations("settings");
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Schema (React Compiler handles optimization)
  const emailSchema = createTranslatedEmailSchema((key) => tValidation(key));
  const formSchema = z.object({ email: emailSchema });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: FormData) {
    // Check if trying to set the same email
    if (data.email === currentEmail) {
      setServerError(t("same_email"));
      return;
    }

    setServerError(null);

    startTransition(async () => {
      const result = await requestEmailChange(data.email);
      if (result.success) {
        onSuccess(data.email);
      } else {
        setServerError(result.error);
      }
    });
  }

  const error = errors.email?.message || serverError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 py-4">
      <Field.Root>
        <Field.Label>{t("new_email_label")}</Field.Label>
        <Input
          type="email"
          placeholder={t("new_email_placeholder")}
          autoComplete="email"
          autoFocus
          state={error ? "error" : "default"}
          {...register("email")}
        />
        <Field.Error>{error}</Field.Error>
      </Field.Root>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending} size="sm">
          {t("send_confirmation")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
