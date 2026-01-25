"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { StepLayout } from "./step-layout";

// Consistent gradients for logo preview based on name
const gradients = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

interface StepNameProps {
  name: string;
  totalSteps: number;
  onUpdate: (name: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Name step - collects only the beauty page name.
 * Shows a live preview of how the name will appear.
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
  const displayName = nameValue || t("name.placeholder");
  const initial = displayName.charAt(0).toUpperCase();
  const gradientIndex = displayName.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  const onSubmit = (data: FormData) => {
    onUpdate(data.name);
    onNext();
  };

  return (
    <StepLayout
      currentStep={2}
      totalSteps={totalSteps}
      title={t("name.title")}
      subtitle={t("name.subtitle")}
      onPrevious={onPrevious}
      formId="name-form"
      preview={
        <div className="flex flex-col items-center gap-3">
          {/* Logo/Avatar with gradient */}
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-2xl font-bold text-white`}
          >
            {initial}
          </div>
          {/* Name preview */}
          <h2 className="text-center text-lg font-semibold">{displayName}</h2>
        </div>
      }
    >
      <form
        id="name-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
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
      </form>
    </StepLayout>
  );
}
