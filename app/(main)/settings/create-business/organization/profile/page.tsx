"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { useOrganizationWizard } from "../../_lib/organization-wizard-context";
import { createTranslatedOrganizationProfileSchema } from "../../schemas";
import { FormField } from "../../_components/form-field";
import { WizardButtons } from "../../_components/wizard-buttons";
import { WizardProgress } from "../../_components/wizard-progress";
import type { OrganizationProfileData } from "../../_lib/types";

const STEPS = ["profile", "contacts"];

export default function OrganizationProfilePage() {
  const router = useRouter();
  const t = useTranslations("business.wizard");
  const tValidation = useTranslations("business.validation");
  const { profileData, setProfileData, goToStep } = useOrganizationWizard();

  const schema = createTranslatedOrganizationProfileSchema((key) =>
    tValidation(key),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationProfileData>({
    resolver: zodResolver(schema),
    defaultValues: profileData || {
      name: "",
      slug: "",
      description: "",
    },
  });

  function onSubmit(data: OrganizationProfileData) {
    setProfileData(data);
    goToStep("contacts");
    router.push("/settings/create-business/organization/contacts");
  }

  return (
    <div className="space-y-6">
      <WizardProgress
        steps={STEPS}
        currentStep={0}
        labels={[t("step_profile"), t("step_contacts")]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label={t("org_name_label")}
          error={errors.name?.message}
          required
        >
          <Input
            {...register("name")}
            placeholder={t("org_name_placeholder")}
            state={errors.name ? "error" : "default"}
          />
        </FormField>

        <FormField
          label={t("slug_label")}
          error={errors.slug?.message}
          hint={t("org_slug_hint")}
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
            placeholder={t("org_description_placeholder")}
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
