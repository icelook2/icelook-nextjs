"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { BeautyPagePreview } from "./previews/beauty-page-preview";
import { StepLayout } from "./step-layout";

interface StepContactsProps {
  name: string;
  nickname: string;
  avatarPreviewUrl: string | null;
  instagram: string;
  telegram: string;
  phone: string;
  totalSteps: number;
  onUpdate: (contacts: { instagram: string; telegram: string; phone: string }) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

interface FormData {
  instagram: string;
  telegram: string;
  phone: string;
}

/**
 * Normalize Instagram input to username only.
 * Accepts: @username, username, full URL
 * Returns: just the username without @ or URL
 */
function normalizeInstagram(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  // Remove @ prefix if present
  if (trimmed.startsWith("@")) {
    return trimmed.slice(1);
  }

  // Extract username from URL
  const urlMatch = trimmed.match(/(?:instagram\.com|instagr\.am)\/([^/?#]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  return trimmed;
}

/**
 * Normalize Telegram input to username only.
 * Accepts: @username, username, t.me/username, full URL
 * Returns: just the username without @ or URL
 */
function normalizeTelegram(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  // Remove @ prefix if present
  if (trimmed.startsWith("@")) {
    return trimmed.slice(1);
  }

  // Extract username from URL
  const urlMatch = trimmed.match(/(?:t\.me|telegram\.me)\/([^/?#]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  return trimmed;
}

/**
 * Normalize phone number - remove spaces and ensure + prefix for international
 */
function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  // Remove all non-digit characters except +
  const cleaned = trimmed.replace(/[^\d+]/g, "");

  return cleaned;
}

/**
 * Step 4: Contacts
 *
 * Allows users to add their social media handles and phone number.
 * All fields are optional - users can skip or fill in any combination.
 */
export function StepContacts({
  name,
  nickname,
  avatarPreviewUrl,
  instagram,
  telegram,
  phone,
  totalSteps,
  onUpdate,
  onNext,
  onPrevious,
  onSkip,
}: StepContactsProps) {
  const t = useTranslations("create_beauty_page");

  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: { instagram, telegram, phone },
  });

  const instagramValue = watch("instagram");
  const telegramValue = watch("telegram");
  const phoneValue = watch("phone");

  const hasAnyContact = instagramValue || telegramValue || phoneValue;

  const onSubmit = (data: FormData) => {
    onUpdate({
      instagram: normalizeInstagram(data.instagram),
      telegram: normalizeTelegram(data.telegram),
      phone: normalizePhone(data.phone),
    });
    onNext();
  };

  const handleSkip = () => {
    onUpdate({ instagram: "", telegram: "", phone: "" });
    onSkip();
  };

  return (
    <StepLayout
      currentStep={4}
      totalSteps={totalSteps}
      title={t("contacts.title")}
      subtitle={t("contacts.subtitle")}
      previewLabel={t("preview.label")}
      preview={
        <BeautyPagePreview
          name={name}
          nickname={nickname}
          avatarPreviewUrl={avatarPreviewUrl}
          instagram={normalizeInstagram(instagramValue || "")}
          telegram={normalizeTelegram(telegramValue || "")}
          phone={normalizePhone(phoneValue || "")}
          activeTab="contacts"
        />
      }
      onBack={onPrevious}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Instagram */}
        <Field.Root>
          <Field.Label>{t("contacts.instagram_label")}</Field.Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-muted">@</span>
            </div>
            <Input
              type="text"
              placeholder={t("contacts.instagram_placeholder")}
              className="pl-7"
              {...register("instagram")}
            />
          </div>
        </Field.Root>

        {/* Telegram */}
        <Field.Root>
          <Field.Label>{t("contacts.telegram_label")}</Field.Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-muted">@</span>
            </div>
            <Input
              type="text"
              placeholder={t("contacts.telegram_placeholder")}
              className="pl-7"
              {...register("telegram")}
            />
          </div>
        </Field.Root>

        {/* Phone */}
        <Field.Root>
          <Field.Label>{t("contacts.phone_label")}</Field.Label>
          <Input
            type="tel"
            placeholder={t("contacts.phone_placeholder")}
            {...register("phone")}
          />
        </Field.Root>

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-2">
          {hasAnyContact ? (
            <Button type="submit">
              {t("navigation.continue")}
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={handleSkip}>
              {t("navigation.skip")}
            </Button>
          )}
        </div>
      </form>
    </StepLayout>
  );
}
