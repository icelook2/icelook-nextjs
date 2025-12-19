"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { Instagram, Phone, Send, MessageCircle } from "lucide-react";

import { Input } from "@/lib/ui/input";
import { useSalonWizard } from "../../_lib/salon-wizard-context";
import { createTranslatedContactsSchema } from "../../schemas";
import { FormField } from "../../_components/form-field";
import { WizardButtons } from "../../_components/wizard-buttons";
import { WizardProgress } from "../../_components/wizard-progress";
import { createSalon } from "../../_actions/create-salon.action";
import type { ContactsData } from "../../_lib/types";

const STEPS = ["profile", "address", "contacts"];

export default function SalonContactsPage() {
  const router = useRouter();
  const t = useTranslations("business.wizard");
  const tValidation = useTranslations("business.validation");
  const { profileData, addressData, contactsData, setContactsData, organizationId } =
    useSalonWizard();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const schema = createTranslatedContactsSchema((key) => tValidation(key));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactsData>({
    resolver: zodResolver(schema),
    defaultValues: contactsData,
  });

  // Redirect if missing previous data
  useEffect(() => {
    if (!profileData) {
      router.replace("/settings/create-business/salon/profile");
    } else if (!addressData.address_line1) {
      router.replace("/settings/create-business/salon/address");
    }
  }, [profileData, addressData, router]);

  function onSubmit(data: ContactsData) {
    setContactsData(data);
    setError(null);

    startTransition(async () => {
      const result = await createSalon({
        profile: profileData!,
        address: addressData,
        contacts: data,
        organization_id: organizationId || undefined,
      });

      if (result.success) {
        router.push(`/salon/${result.slug}`);
      } else {
        setError(result.error);
      }
    });
  }

  if (!profileData || !addressData.address_line1) {
    return null;
  }

  return (
    <div className="space-y-6">
      <WizardProgress
        steps={STEPS}
        currentStep={2}
        labels={[t("step_profile"), t("step_address"), t("step_contacts")]}
      />

      <p className="text-center text-sm text-foreground/60">
        {t("contacts_description")}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label={t("instagram_label")}
          error={errors.instagram?.message}
        >
          <div className="relative">
            <Instagram className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
            <Input
              {...register("instagram")}
              placeholder={t("instagram_placeholder")}
              state={errors.instagram ? "error" : "default"}
              className="pl-12"
            />
          </div>
        </FormField>

        <FormField label={t("phone_label")} error={errors.phone?.message}>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
            <Input
              {...register("phone")}
              placeholder={t("phone_placeholder")}
              state={errors.phone ? "error" : "default"}
              className="pl-12"
            />
          </div>
        </FormField>

        <FormField label={t("telegram_label")} error={errors.telegram?.message}>
          <div className="relative">
            <Send className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
            <Input
              {...register("telegram")}
              placeholder={t("telegram_placeholder")}
              state={errors.telegram ? "error" : "default"}
              className="pl-12"
            />
          </div>
        </FormField>

        <FormField label={t("viber_label")} error={errors.viber?.message}>
          <div className="relative">
            <MessageCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
            <Input
              {...register("viber")}
              placeholder={t("viber_placeholder")}
              state={errors.viber ? "error" : "default"}
              className="pl-12"
            />
          </div>
        </FormField>

        <FormField label={t("whatsapp_label")} error={errors.whatsapp?.message}>
          <div className="relative">
            <MessageCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
            <Input
              {...register("whatsapp")}
              placeholder={t("whatsapp_placeholder")}
              state={errors.whatsapp ? "error" : "default"}
              className="pl-12"
            />
          </div>
        </FormField>

        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        <WizardButtons
          backHref="/settings/create-business/salon/address"
          backLabel={t("back")}
          nextLabel={t("finish")}
          isSubmitting={isPending}
        />
      </form>
    </div>
  );
}
