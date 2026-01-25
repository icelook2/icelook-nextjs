"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import { DotProgress } from "./dot-progress";

interface StepLayoutProps {
  /** Preview content shown at the top */
  preview?: ReactNode;
  /** Current step number (1-indexed for display) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Main title for the step */
  title: string;
  /** Subtitle/description shown below the title */
  subtitle?: string;
  /** Form/content area */
  children: ReactNode;
  /** Called when Previous button is clicked */
  onPrevious?: () => void;
  /** Called when Continue/Next button is clicked (for non-form steps) */
  onNext?: () => void;
  /** Called when Skip button is clicked */
  onSkip?: () => void;
  /** Form ID if using form submission instead of onNext */
  formId?: string;
  /** Label for the next/continue button */
  nextLabel?: string;
  /** Whether the next button is disabled */
  nextDisabled?: boolean;
  /** Whether next action is loading */
  nextLoading?: boolean;
  /** Hide navigation buttons (for confirmation step with custom button) */
  hideNavigation?: boolean;
  /** Custom navigation content (replaces default buttons) */
  customNavigation?: ReactNode;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Step layout for the create beauty page flow.
 *
 * Layout (mobile-first, centered):
 * - Preview area at top (in a card)
 * - Dot progress indicator
 * - Title + subtitle
 * - Form/content
 * - Fixed navigation at bottom
 */
export function StepLayout({
  preview,
  currentStep,
  totalSteps,
  title,
  subtitle,
  children,
  onPrevious,
  onNext,
  onSkip,
  formId,
  nextLabel,
  nextDisabled,
  nextLoading,
  hideNavigation,
  customNavigation,
  className,
}: StepLayoutProps) {
  const t = useTranslations("create_beauty_page");

  const hasSkip = Boolean(onSkip);
  const showPrevious = currentStep > 1 && onPrevious;

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      {/* Main content area - centered */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28 pt-6">
        {/* Preview area */}
        {preview && (
          <div className="mb-6">
            <div className="rounded-2xl border border-border bg-surface-secondary p-6">
              {preview}
            </div>
          </div>
        )}

        {/* Dot progress */}
        <div className="mb-6 flex justify-center">
          <DotProgress currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        {/* Title + Subtitle */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>

        {/* Form/Content */}
        <div className="flex-1">{children}</div>
      </div>

      {/* Fixed bottom navigation */}
      {!hideNavigation && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            {customNavigation ? (
              customNavigation
            ) : (
              <>
                {/* Previous button */}
                {showPrevious ? (
                  <Button type="button" variant="outline" onClick={onPrevious}>
                    {t("navigation.previous")}
                  </Button>
                ) : (
                  <div /> // Spacer
                )}

                {/* Right side: Skip + Continue */}
                <div className="flex items-center gap-3">
                  {hasSkip && (
                    <Button type="button" variant="ghost" onClick={onSkip}>
                      {t("navigation.skip")}
                    </Button>
                  )}

                  {formId ? (
                    <Button
                      type="submit"
                      form={formId}
                      disabled={nextDisabled}
                      loading={nextLoading}
                    >
                      {nextLabel || t("navigation.continue")}
                    </Button>
                  ) : onNext ? (
                    <Button
                      type="button"
                      onClick={onNext}
                      disabled={nextDisabled}
                      loading={nextLoading}
                    >
                      {nextLabel || t("navigation.continue")}
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
