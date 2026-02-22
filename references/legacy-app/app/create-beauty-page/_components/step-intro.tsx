"use client";

import { Calendar, Globe, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { DotProgress } from "./dot-progress";

interface StepIntroProps {
  totalSteps: number;
  onNext: () => void;
}

/**
 * Introduction step explaining what a beauty page is.
 * Clean, minimal design matching the app's style.
 */
export function StepIntro({ totalSteps, onNext }: StepIntroProps) {
  const t = useTranslations("create_beauty_page.intro");

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Main content area */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8">
        {/* Dot progress */}
        <div className="mb-8 flex justify-center">
          <DotProgress currentStep={1} totalSteps={totalSteps} />
        </div>

        {/* Title + Subtitle */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        {/* What is a beauty page - explanation card */}
        <Paper className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-medium text-muted">
            {t("what_is_title")}
          </h2>
          <p className="text-sm leading-relaxed">{t("what_is_description")}</p>
        </Paper>

        {/* Benefits */}
        <Paper className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-medium text-muted">
            {t("benefits_title")}
          </h2>
          <ul className="space-y-4">
            <BenefitItem
              icon={<Globe className="h-5 w-5" />}
              title={t("benefit_1_title")}
              description={t("benefit_1_description")}
            />
            <BenefitItem
              icon={<Calendar className="h-5 w-5" />}
              title={t("benefit_2_title")}
              description={t("benefit_2_description")}
            />
            <BenefitItem
              icon={<Star className="h-5 w-5" />}
              title={t("benefit_3_title")}
              description={t("benefit_3_description")}
            />
          </ul>
        </Paper>

        {/* Who it's for */}
        <Paper className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-medium text-muted">
            {t("perfect_for")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <AudienceTag icon={<Users className="h-3.5 w-3.5" />}>
              {t("audience_hair")}
            </AudienceTag>
            <AudienceTag icon={<Users className="h-3.5 w-3.5" />}>
              {t("audience_nails")}
            </AudienceTag>
            <AudienceTag icon={<Users className="h-3.5 w-3.5" />}>
              {t("audience_makeup")}
            </AudienceTag>
            <AudienceTag icon={<Users className="h-3.5 w-3.5" />}>
              {t("audience_skin")}
            </AudienceTag>
          </div>
        </Paper>

        {/* Continue button */}
        <Button onClick={onNext} className="w-full">
          {t("cta")}
        </Button>
      </div>
    </div>
  );
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </li>
  );
}

function AudienceTag({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-3 py-1.5 text-sm">
      <span className="text-muted">{icon}</span>
      {children}
    </span>
  );
}
