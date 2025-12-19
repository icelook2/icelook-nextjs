"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { useSalonWizard } from "../../_lib/salon-wizard-context";
import { createTranslatedSalonProfileSchema } from "../../schemas";
import { FormField } from "../../_components/form-field";
import { WizardButtons } from "../../_components/wizard-buttons";
import { WizardProgress } from "../../_components/wizard-progress";
import type { SalonProfileData } from "../../_lib/types";

const STEPS = ["profile", "address", "contacts"];

export default function SalonProfilePage() {
  const router = useRouter();
  const t = useTranslations("business.wizard");
  const tValidation = useTranslations("business.validation");
  const { profileData, setProfileData, goToStep } = useSalonWizard();

  const schema = createTranslatedSalonProfileSchema((key) => tValidation(key));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SalonProfileData>({
    resolver: zodResolver(schema),
    defaultValues: profileData || {
      name: "",
      slug: "",
      description: "",
    },
  });

  function onSubmit(data: SalonProfileData) {
    setProfileData(data);
    goToStep("address");
    router.push("/settings/create-business/salon/address");
  }

  return (
    <div className="space-y-6">
      <WizardProgress
        steps={STEPS}
        currentStep={0}
        labels={[t("step_profile"), t("step_address"), t("step_contacts")]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label={t("name_label")}
          error={errors.name?.message}
          required
        >
          <Input
            {...register("name")}
            placeholder={t("name_placeholder")}
            state={errors.name ? "error" : "default"}
          />
        </FormField>

        <FormField
          label={t("slug_label")}
          error={errors.slug?.message}
          hint={t("slug_hint")}
          required
        >
          <Input
            {...register("slug")}
            placeholder={t("slug_placeholder")}
            state={errors.slug ? "error" : "default"}
          />
        </FormField>

        <FormField
          label={t("description_label")}
          error={errors.description?.message}
        >
          <Textarea
            {...register("description")}
            placeholder={t("description_placeholder")}
            state={errors.description ? "error" : "default"}
            rows={3}
          />
        </FormField>

        <WizardButtons
          backHref="/settings/create-business/type"
          backLabel={t("back")}
          nextLabel={t("next")}
        />
      </form>
    </div>
  );
}
