"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Instagram, Phone, Send, MessageCircle } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { useWizard, DEFAULT_CONTACTS } from "../_lib/wizard-context";
import { createTranslatedContactsSchema } from "../schemas";
import { WizardProgress } from "./wizard-progress";
import { createSpecialist } from "../_actions/create-specialist.action";

export function ContactsForm() {
  const t = useTranslations("specialist.wizard");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    profileData,
    services,
    contactsData,
    setContactsData,
    goToStep,
    reset,
  } = useWizard();

  // Redirect if no profile data
  useEffect(() => {
    if (!profileData) {
      router.push("/settings/become-specialist/profile");
    }
  }, [profileData, router]);

  // Show nothing while redirecting
  if (!profileData) {
    return null;
  }

  const formSchema = useMemo(() => {
    return createTranslatedContactsSchema((key) => tValidation(key));
  }, [tValidation]);

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: contactsData ?? DEFAULT_CONTACTS,
  });

  function onSubmit(data: FormData) {
    setServerError(null);
    setContactsData(data);

    startTransition(async () => {
      // profileData is guaranteed to be non-null due to early return above
      const result = await createSpecialist({
        profile: profileData!,
        services,
        contacts: data,
      });

      if (result.success) {
        reset();
        router.push(`/@${result.username}`);
      } else {
        setServerError(result.error);
      }
    });
  }

  function handleBack() {
    goToStep("services");
    router.push("/settings/become-specialist/services");
  }

  function handleSkip() {
    setServerError(null);
    setContactsData(DEFAULT_CONTACTS);

    startTransition(async () => {
      // profileData is guaranteed to be non-null due to early return above
      const result = await createSpecialist({
        profile: profileData!,
        services,
        contacts: DEFAULT_CONTACTS,
      });

      if (result.success) {
        reset();
        router.push(`/@${result.username}`);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <WizardProgress
        currentStep="contacts"
        completedSteps={["profile", "services"]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-500">{t("contacts_description")}</p>

        {/* Instagram */}
        <Field.Root>
          <Field.Label className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            {t("instagram_label")}
          </Field.Label>
          <Input
            type="text"
            placeholder={t("instagram_placeholder")}
            state={errors.instagram ? "error" : "default"}
            {...register("instagram")}
          />
          <Field.Error>{errors.instagram?.message}</Field.Error>
        </Field.Root>

        {/* Phone */}
        <Field.Root>
          <Field.Label className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {t("phone_label")}
          </Field.Label>
          <Input
            type="tel"
            placeholder={t("phone_placeholder")}
            state={errors.phone ? "error" : "default"}
            {...register("phone")}
          />
          <Field.Error>{errors.phone?.message}</Field.Error>
        </Field.Root>

        {/* Telegram */}
        <Field.Root>
          <Field.Label className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t("telegram_label")}
          </Field.Label>
          <Input
            type="text"
            placeholder={t("telegram_placeholder")}
            state={errors.telegram ? "error" : "default"}
            {...register("telegram")}
          />
          <Field.Error>{errors.telegram?.message}</Field.Error>
        </Field.Root>

        {/* Viber */}
        <Field.Root>
          <Field.Label className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {t("viber_label")}
          </Field.Label>
          <Input
            type="tel"
            placeholder={t("viber_placeholder")}
            state={errors.viber ? "error" : "default"}
            {...register("viber")}
          />
          <Field.Error>{errors.viber?.message}</Field.Error>
        </Field.Root>

        {/* WhatsApp */}
        <Field.Root>
          <Field.Label className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {t("whatsapp_label")}
          </Field.Label>
          <Input
            type="tel"
            placeholder={t("whatsapp_placeholder")}
            state={errors.whatsapp ? "error" : "default"}
            {...register("whatsapp")}
          />
          <Field.Error>{errors.whatsapp?.message}</Field.Error>
        </Field.Root>

        {/* Server Error */}
        {serverError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={isPending}
          >
            {t("back")}
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSkip}
              disabled={isPending}
              loading={isPending}
            >
              {t("skip_and_finish")}
            </Button>
            <Button type="submit" disabled={isPending} loading={isPending}>
              {t("finish")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
