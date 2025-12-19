"use client";

import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
  labels?: string[];
}

export function WizardProgress({
  steps,
  currentStep,
  labels,
}: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted &&
                    "bg-violet-500 text-white",
                  isCurrent &&
                    "border-2 border-violet-500 bg-violet-500/10 text-violet-500",
                  !isCompleted &&
                    !isCurrent &&
                    "border-2 border-foreground/20 bg-background text-foreground/40",
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {labels?.[index] && (
                <span
                  className={cn(
                    "text-xs",
                    isCurrent
                      ? "text-foreground"
                      : "text-foreground/50",
                  )}
                >
                  {labels[index]}
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8",
                  isCompleted
                    ? "bg-violet-500"
                    : "bg-foreground/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
