"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { updateProfileName } from "../_actions";
import { createTranslatedNameSchema } from "../schemas";

interface ProfileSectionProps {
  initialName: string;
}

export function ProfileSection({ initialName }: ProfileSectionProps) {
  const t = useTranslations("settings");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const formSchema = useMemo(() => {
    const nameSchema = createTranslatedNameSchema((key) => tValidation(key));
    return z.object({ name: nameSchema });
  }, [tValidation]);

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: initialName },
  });

  function onSubmit(data: FormData) {
    setServerError(null);
    setSaveSuccess(false);

    startTransition(async () => {
      const result = await updateProfileName(data.name);
      if (result.success) {
        setSaveSuccess(true);
        router.refresh();
        // Reset success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setServerError(result.error);
      }
    });
  }

  const error = errors.name?.message || serverError;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t("profile_section")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field.Root>
          <Field.Label>{t("name_label")}</Field.Label>
          <Input
            type="text"
            placeholder={t("name_placeholder")}
            autoComplete="name"
            state={error ? "error" : "default"}
            {...register("name")}
          />
          <Field.Error>{error}</Field.Error>
        </Field.Root>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            loading={isPending}
            disabled={!isDirty}
            size="sm"
          >
            {t("save")}
          </Button>
          {saveSuccess && (
            <span className="text-sm text-green-600">{t("saved")}</span>
          )}
        </div>
      </form>
    </section>
  );
}
