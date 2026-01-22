"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { signInWithOtp } from "../actions";
import { createTranslatedSchemas } from "../schemas";

interface EmailStepProps {
  onSubmitted: (email: string) => void;
}

export function EmailStep({ onSubmitted }: EmailStepProps) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const [serverError, setServerError] = useState<string | null>(null);

  // Schema (React Compiler handles optimization)
  const schemas = createTranslatedSchemas((key) => tValidation(key));
  const formSchema = z.object({ email: schemas.email });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);

    const result = await signInWithOtp(data.email);

    if (result.success) {
      onSubmitted(data.email);
    } else {
      setServerError(result.error);
    }
  }

  const error = errors.email?.message || serverError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field.Root>
        <Field.Label>{t("email_label")}</Field.Label>
        <Input
          type="email"
          placeholder={t("email_placeholder")}
          autoComplete="email"
          autoFocus
          state={error ? "error" : "default"}
          {...register("email")}
        />
        <Field.Error>{error}</Field.Error>
      </Field.Root>

      <Button type="submit" loading={isSubmitting} className="w-full">
        {t("continue")}
      </Button>
    </form>
  );
}
