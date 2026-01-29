"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { BeautyPagePreview } from "./previews/beauty-page-preview";
import { StepLayout } from "./step-layout";

interface StepNameProps {
  name: string;
  totalSteps: number;
  onUpdate: (name: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Name step - collects the beauty page name.
 *
 * Uses StepLayout with "split" variant:
 * - Desktop: Form panel on left, real-time preview on right
 * - Mobile: Form only (preview hidden)
 */
export function StepName({
  name,
  totalSteps,
  onUpdate,
  onNext,
  onPrevious,
}: StepNameProps) {
  const t = useTranslations("create_beauty_page");
  const tValidation = useTranslations("validation");

  const schema = z.object({
    name: z
      .string()
      .min(2, tValidation("name_min", { min: 2 }))
      .max(100, tValidation("name_max", { max: 100 })),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name },
  });

  const nameValue = watch("name");

  const onSubmit = (data: FormData) => {
    onUpdate(data.name);
    onNext();
  };

  // Generate a slug preview from the name
  const slugPreview = nameValue
    ? nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30)
    : "";

  return (
    <StepLayout
      currentStep={1}
      totalSteps={totalSteps}
      title={t("name.title")}
      subtitle={t("name.subtitle")}
      previewLabel={t("preview.label")}
      preview={<BeautyPagePreview name={nameValue} nickname={slugPreview} />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Field.Root>
          <Field.Label>{t("name.label")}</Field.Label>
          <Input
            type="text"
            placeholder={t("name.placeholder")}
            state={errors.name ? "error" : "default"}
            autoFocus
            {...register("name")}
          />
          <Field.Error>{errors.name?.message}</Field.Error>
        </Field.Root>

        <Button type="submit">{t("navigation.continue")}</Button>
      </form>
    </StepLayout>
  );
}
