"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DotProgress } from "./dot-progress";

interface StepLayoutProps {
  /** Preview content shown on the right side (hidden on mobile) */
  preview?: ReactNode;
  /** Label for the preview section */
  previewLabel?: string;
  /** Current step number (1-indexed for display) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Main title for the step */
  title: string;
  /** Subtitle/description shown below the title */
  subtitle?: string;
  /** Form/content area (should include its own submit button) */
  children: ReactNode;
  /** Called when back button is clicked (shows back button when provided) */
  onBack?: () => void;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Step layout for the create beauty page flow.
 *
 * Split layout:
 * - Desktop: Form panel on left (styled card), preview on right
 * - Mobile: Form only (preview hidden)
 *
 * Each step handles its own navigation (Continue button in form).
 */
export function StepLayout({
  preview,
  previewLabel,
  currentStep,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  className,
}: StepLayoutProps) {
  const t = useTranslations("create_beauty_page");

  return (
    <div
      className={cn(
        "min-h-dvh px-4 py-6 sm:grid sm:grid-cols-4 sm:gap-6 sm:p-6 lg:grid-cols-3 lg:gap-8 lg:p-8",
        className,
      )}
    >
      {/* Form Panel - 2 cols on sm/md, 1 col on lg */}
      <div className="mx-auto w-full max-w-md sm:col-span-2 sm:mx-0 sm:max-w-none sm:rounded-2xl sm:border sm:border-border sm:bg-surface sm:p-8 sm:shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-1 dark:sm:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        {/* Back button + Progress indicator */}
        <div className="mb-6 flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent-soft/50"
              aria-label={t("navigation.previous")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs text-muted">
              {t("navigation.step_of", { current: currentStep, total: totalSteps })}
            </span>
            <DotProgress currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        </div>

        {/* Title + Subtitle */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>

        {/* Form/Content */}
        <div className="flex-1">{children}</div>
      </div>

      {/* Preview Panel - 2 cols on all breakpoints, hidden on mobile */}
      {preview && (
        <div className="hidden sm:col-span-2 sm:flex sm:justify-center">
          <div className="max-w-xl flex-1">
            {previewLabel && (
              <div className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">
                {previewLabel}
              </div>
            )}
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}
