"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Select } from "@/lib/ui/select";
import { Textarea } from "@/lib/ui/textarea";
import { useWizard } from "../_lib/wizard-context";
import { SPECIALTIES, type Specialty } from "../_lib/types";
import { createTranslatedProfileSchema } from "../schemas";
import { WizardProgress } from "./wizard-progress";

/**
 * Generates a URL-friendly username from display name
 */
function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);
}

export function ProfileForm() {
  const t = useTranslations("specialist.wizard");
  const tValidation = useTranslations("validation");
  const tSpecialties = useTranslations("specialist.specialties");
  const router = useRouter();
  const { profileData, setProfileData, goToStep } = useWizard();

  const formSchema = useMemo(() => {
    return createTranslatedProfileSchema((key) => tValidation(key));
  }, [tValidation]);

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: profileData ?? {
      displayName: "",
      bio: "",
      specialty: undefined,
      username: "",
    },
  });

  // Auto-generate username when display name changes
  const displayName = watch("displayName");
  const username = watch("username");

  useEffect(() => {
    // Only auto-generate if username is empty or was auto-generated before
    if (!username || username === generateUsername(displayName.slice(0, -1))) {
      const generated = generateUsername(displayName);
      if (generated) {
        setValue("username", generated);
      }
    }
  }, [displayName, username, setValue]);

  function onSubmit(data: FormData) {
    setProfileData(data as FormData & { specialty: Specialty });
    goToStep("services");
    router.push("/settings/become-specialist/services");
  }

  const specialtyOptions = SPECIALTIES.map((specialty) => ({
    value: specialty,
    label: tSpecialties(specialty),
  }));

  const displayNameError = errors.displayName?.message;
  const bioError = errors.bio?.message;
  const specialtyError = errors.specialty?.message;
  const usernameError = errors.username?.message;

  return (
    <div className="space-y-6">
      <WizardProgress currentStep="profile" completedSteps={[]} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Display Name */}
        <Field.Root>
          <Field.Label>{t("display_name_label")}</Field.Label>
          <Input
            type="text"
            placeholder={t("display_name_placeholder")}
            autoComplete="name"
            state={displayNameError ? "error" : "default"}
            {...register("displayName")}
          />
          <Field.Error>{displayNameError}</Field.Error>
        </Field.Root>

        {/* Bio */}
        <Field.Root>
          <Field.Label>{t("bio_label")}</Field.Label>
          <Textarea
            placeholder={t("bio_placeholder")}
            rows={3}
            state={bioError ? "error" : "default"}
            {...register("bio")}
          />
          <Field.Description>{t("bio_description")}</Field.Description>
          <Field.Error>{bioError}</Field.Error>
        </Field.Root>

        {/* Specialty */}
        <Field.Root>
          <Field.Label>{t("specialty_label")}</Field.Label>
          <Select.Root
            value={watch("specialty")}
            onValueChange={(value) =>
              setValue("specialty", value as Specialty, {
                shouldValidate: true,
              })
            }
          >
            <Select.Trigger
              state={specialtyError ? "error" : "default"}
              placeholder={t("specialty_placeholder")}
            />
            <Select.Content>
              {specialtyOptions.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Field.Error>{specialtyError}</Field.Error>
        </Field.Root>

        {/* Username */}
        <Field.Root>
          <Field.Label>{t("username_label")}</Field.Label>
          <div className="flex items-center gap-2">
            <span className="text-foreground/50">@</span>
            <Input
              type="text"
              placeholder={t("username_placeholder")}
              autoComplete="off"
              state={usernameError ? "error" : "default"}
              {...register("username")}
            />
          </div>
          <Field.Description>{t("username_description")}</Field.Description>
          <Field.Error>{usernameError}</Field.Error>
        </Field.Root>

        <div className="flex justify-end pt-4">
          <Button type="submit">{t("next")}</Button>
        </div>
      </form>
    </div>
  );
}
