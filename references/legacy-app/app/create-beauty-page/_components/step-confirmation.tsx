"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";
import type { ServiceData } from "../_lib/types";
import { BeautyPagePreview } from "./previews/beauty-page-preview";
import { StepLayout } from "./step-layout";

interface StepConfirmationProps {
  name: string;
  nickname: string;
  avatarPreviewUrl: string | null;
  services: ServiceData[];
  totalSteps: number;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Step 8: Confirmation
 *
 * Final step showing a preview of the beauty page before creation.
 */
export function StepConfirmation({
  name,
  nickname,
  avatarPreviewUrl,
  services,
  totalSteps,
  onPrevious,
  onSubmit,
  isSubmitting,
}: StepConfirmationProps) {
  const t = useTranslations("create_beauty_page");

  return (
    <StepLayout
      currentStep={totalSteps}
      totalSteps={totalSteps}
      title={t("confirmation.title")}
      subtitle={t("confirmation.subtitle")}
      previewLabel={t("preview.label")}
      preview={<BeautyPagePreview name={name} nickname={nickname} avatarPreviewUrl={avatarPreviewUrl} services={services} />}
      onBack={onPrevious}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted">
          {t("confirmation.ready_message")}
        </p>

        {/* Submit button */}
        <Button
          onClick={onSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          {t("navigation.create")}
        </Button>
      </div>
    </StepLayout>
  );
}
