"use client";

import { cn } from "@/lib/utils/cn";

interface DotProgressProps {
  /** Current step number (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Additional class names */
  className?: string;
}

/**
 * Minimal dot progress indicator.
 *
 * Shows dots representing each step:
 * - Filled dot (●) for current step
 * - Empty dot (○) for other steps
 *
 * Example: ○ ○ ● ○ ○ ○ ○ (step 3 of 7)
 */
export function DotProgress({
  currentStep,
  totalSteps,
  className,
}: DotProgressProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div
            key={stepNumber}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              isCurrent
                ? "bg-accent"
                : isCompleted
                  ? "bg-accent/50"
                  : "bg-muted/30",
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
