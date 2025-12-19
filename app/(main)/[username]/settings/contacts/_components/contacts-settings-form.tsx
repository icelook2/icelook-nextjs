"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Instagram, Phone, Send, MessageCircle } from "lucide-react";
import { Input } from "@/lib/ui/input";
import { Button } from "@/lib/ui/button";
import { updateSpecialistContacts } from "../../_actions/specialist-settings.action";

interface ContactsSettingsFormProps {
  specialistId: string;
  initialData: {
    instagram: string;
    phone: string;
    telegram: string;
    viber: string;
    whatsapp: string;
  };
}

interface FormValues {
  instagram: string;
  phone: string;
  telegram: string;
  viber: string;
  whatsapp: string;
}

export function ContactsSettingsForm({
  specialistId,
  initialData,
}: ContactsSettingsFormProps) {
  const t = useTranslations("specialist.settings.contacts");
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues: initialData,
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateSpecialistContacts(specialistId, data);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const contactFields = [
    {
      name: "instagram" as const,
      label: "Instagram",
      icon: Instagram,
      placeholder: t("instagram_placeholder"),
      hint: t("instagram_hint"),
    },
    {
      name: "phone" as const,
      label: t("phone"),
      icon: Phone,
      placeholder: t("phone_placeholder"),
      hint: t("phone_hint"),
    },
    {
      name: "telegram" as const,
      label: "Telegram",
      icon: Send,
      placeholder: t("telegram_placeholder"),
      hint: t("telegram_hint"),
    },
    {
      name: "viber" as const,
      label: "Viber",
      icon: MessageCircle,
      placeholder: t("viber_placeholder"),
      hint: t("viber_hint"),
    },
    {
      name: "whatsapp" as const,
      label: "WhatsApp",
      icon: MessageCircle,
      placeholder: t("whatsapp_placeholder"),
      hint: t("whatsapp_hint"),
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-foreground/60">{t("description")}</p>

      <div className="space-y-4">
        {contactFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label
              htmlFor={field.name}
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <field.icon className="h-4 w-4 text-foreground/60" />
              {field.label}
            </label>
            <Input
              id={field.name}
              {...register(field.name)}
              placeholder={field.placeholder}
            />
            <p className="text-xs text-foreground/60">{field.hint}</p>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={!isDirty || isPending}>
        {isPending ? t("saving") : t("save_changes")}
      </Button>
    </form>
  );
}
