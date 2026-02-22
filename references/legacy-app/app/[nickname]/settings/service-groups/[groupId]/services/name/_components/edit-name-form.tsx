"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { updateServiceGroup } from "../../_actions";

interface EditNameFormProps {
  serviceGroupId: string;
  beautyPageId: string;
  nickname: string;
  initialName: string;
}

const formSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

type FormData = z.infer<typeof formSchema>;

export function EditNameForm({
  serviceGroupId,
  beautyPageId,
  nickname,
  initialName,
}: EditNameFormProps) {
  const t = useTranslations("service_groups");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      const result = await updateServiceGroup({
        id: serviceGroupId,
        name: data.name,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        setSaveSuccess(true);
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setServerError(result.error);
      }
    });
  }

  const error = errors.name?.message || serverError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field.Root>
        <Field.Label>{t("group_name_label")}</Field.Label>
        <Input
          type="text"
          placeholder={t("group_name_placeholder")}
          state={error ? "error" : "default"}
          {...register("name")}
        />
        <Field.Error>{error}</Field.Error>
      </Field.Root>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending} disabled={!isDirty} size="sm">
          {t("save")}
        </Button>
        {saveSuccess && <span className="text-sm">{t("saved")}</span>}
      </div>
    </form>
  );
}
