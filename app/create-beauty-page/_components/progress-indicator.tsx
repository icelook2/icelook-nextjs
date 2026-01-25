"use client";

import { Check } from "lucide-react";
import { STEP_ORDER } from "../_lib/constants";
import type { CreateBeautyPageStep } from "../_lib/types";

interface ProgressIndicatorProps {
  currentStep: CreateBeautyPageStep;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2">
      {STEP_ORDER.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            {/* Step dot/check */}
            <div
              className={`
                flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all
                ${
                  isCompleted
                    ? "bg-accent text-on-accent"
                    : isCurrent
                      ? "bg-accent text-on-accent"
                      : "bg-muted/20 text-muted"
                }
              `}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Connector line (not after last step) */}
            {index < STEP_ORDER.length - 1 && (
              <div
                className={`
                  h-0.5 w-6 transition-colors sm:w-10
                  ${index < currentIndex ? "bg-accent" : "bg-border"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
