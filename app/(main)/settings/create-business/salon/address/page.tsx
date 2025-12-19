"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { Input } from "@/lib/ui/input";
import { useSalonWizard } from "../../_lib/salon-wizard-context";
import { createTranslatedAddressSchema } from "../../schemas";
import { FormField } from "../../_components/form-field";
import { WizardButtons } from "../../_components/wizard-buttons";
import { WizardProgress } from "../../_components/wizard-progress";
import type { SalonAddressData } from "../../_lib/types";

const STEPS = ["profile", "address", "contacts"];

export default function SalonAddressPage() {
  const router = useRouter();
  const t = useTranslations("business.wizard");
  const tValidation = useTranslations("business.validation");
  const { profileData, addressData, setAddressData, goToStep } = useSalonWizard();

  const schema = createTranslatedAddressSchema((key) => tValidation(key));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SalonAddressData>({
    resolver: zodResolver(schema),
    defaultValues: addressData,
  });

  // Redirect to profile if no profile data
  useEffect(() => {
    if (!profileData) {
      router.replace("/settings/create-business/salon/profile");
    }
  }, [profileData, router]);

  function onSubmit(data: SalonAddressData) {
    setAddressData(data);
    goToStep("contacts");
    router.push("/settings/create-business/salon/contacts");
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <WizardProgress
        steps={STEPS}
        currentStep={1}
        labels={[t("step_profile"), t("step_address"), t("step_contacts")]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label={t("address_line1_label")}
          error={errors.address_line1?.message}
          required
        >
          <Input
            {...register("address_line1")}
            placeholder={t("address_line1_placeholder")}
            state={errors.address_line1 ? "error" : "default"}
          />
        </FormField>

        <FormField
          label={t("address_line2_label")}
          error={errors.address_line2?.message}
        >
          <Input
            {...register("address_line2")}
            placeholder={t("address_line2_placeholder")}
            state={errors.address_line2 ? "error" : "default"}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t("city_label")}
            error={errors.city?.message}
            required
          >
            <Input
              {...register("city")}
              placeholder={t("city_placeholder")}
              state={errors.city ? "error" : "default"}
            />
          </FormField>

          <FormField
            label={t("state_label")}
            error={errors.state?.message}
          >
            <Input
              {...register("state")}
              placeholder={t("state_placeholder")}
              state={errors.state ? "error" : "default"}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t("postal_code_label")}
            error={errors.postal_code?.message}
          >
            <Input
              {...register("postal_code")}
              placeholder={t("postal_code_placeholder")}
              state={errors.postal_code ? "error" : "default"}
            />
          </FormField>

          <FormField
            label={t("country_label")}
            error={errors.country?.message}
            required
          >
            <Input
              {...register("country")}
              placeholder={t("country_placeholder")}
              state={errors.country ? "error" : "default"}
            />
          </FormField>
        </div>

        <WizardButtons
          backHref="/settings/create-business/salon/profile"
          backLabel={t("back")}
          nextLabel={t("next")}
        />
      </form>
    </div>
  );
}
