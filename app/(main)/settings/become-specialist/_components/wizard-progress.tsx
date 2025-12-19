"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WizardStep } from "../_lib/types";

interface WizardProgressProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
}

const STEPS: WizardStep[] = ["profile", "services", "contacts"];

export function WizardProgress({
  currentStep,
  completedSteps,
}: WizardProgressProps) {
  const t = useTranslations("specialist.wizard");

  const stepLabels: Record<WizardStep, string> = {
    profile: t("step_profile"),
    services: t("step_services"),
    contacts: t("step_contacts"),
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step);
        const isCurrent = step === currentStep;
        const stepNumber = index + 1;

        return (
          <div key={step} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted
                    ? "bg-violet-500 text-white"
                    : isCurrent
                      ? "bg-violet-500 text-white"
                      : "bg-gray-200 text-gray-500",
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-xs",
                  isCurrent ? "font-medium text-gray-900" : "text-gray-500",
                )}
              >
                {stepLabels[step]}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12",
                  isCompleted ? "bg-violet-500" : "bg-gray-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
