"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBeautyPageFlow } from "../_actions/create-beauty-page-flow.action";
import { STEP_ORDER, TOTAL_STEPS } from "../_lib/constants";
import {
  type CreateBeautyPageState,
  type CreateBeautyPageStep,
  initialState,
} from "../_lib/types";
import { StepConfigureHours } from "./step-configure-hours";
import { StepConfirmation } from "./step-confirmation";
import { StepIntro } from "./step-intro";
import { StepName } from "./step-name";
import { StepNickname } from "./step-nickname";
import { StepSelectDays } from "./step-select-days";
import { StepServices } from "./step-services";

interface CreateBeautyPageFlowProps {
  existingPagesCount: number;
}

export function CreateBeautyPageFlow(_props: CreateBeautyPageFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<CreateBeautyPageState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Update state with partial updates
  const handleUpdate = (updates: Partial<CreateBeautyPageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Navigate to a specific step
  const goToStep = (step: CreateBeautyPageStep) => {
    setState((prev) => ({ ...prev, step }));
  };

  // Get next step in order
  const getNextStep = (
    currentStep: CreateBeautyPageStep,
  ): CreateBeautyPageStep => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      return STEP_ORDER[currentIndex + 1];
    }
    return currentStep;
  };

  // Get previous step in order
  const getPrevStep = (
    currentStep: CreateBeautyPageStep,
  ): CreateBeautyPageStep => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      return STEP_ORDER[currentIndex - 1];
    }
    return currentStep;
  };

  // Handle next button
  const handleNext = () => {
    const nextStep = getNextStep(state.step);
    goToStep(nextStep);
  };

  // Handle back button
  const handleBack = () => {
    const prevStep = getPrevStep(state.step);
    goToStep(prevStep);
  };

  // Create beauty page (called from confirmation step)
  const handleCreate = () => {
    setError(null);

    const servicesData = state.services.map((s) => ({
      name: s.name,
      priceCents: s.priceCents,
      durationMinutes: s.durationMinutes,
    }));

    const selectedDatesArray = Array.from(state.selectedDates);

    const weekdayHoursArray = Array.from(state.weekdayHours.values()).map(
      (h) => ({
        weekday: h.weekday,
        startTime: h.startTime,
        endTime: h.endTime,
      }),
    );

    startTransition(async () => {
      const result = await createBeautyPageFlow({
        name: state.name,
        nickname: state.nickname,
        services: servicesData,
        selectedDates: selectedDatesArray,
        weekdayHours: weekdayHoursArray,
      });

      if (result.success) {
        router.push(`/${result.nickname}`);
      } else {
        setError(result.error);
      }
    });
  };

  // Handle skip button (for optional steps)
  const handleSkip = () => {
    const currentStep = state.step;

    if (currentStep === "services") {
      // Clear services and move to next step
      setState((prev) => ({
        ...prev,
        services: [],
        step: "working-days",
      }));
    } else if (currentStep === "working-days") {
      // Skip both working-days and working-hours - go directly to confirmation
      setState((prev) => ({
        ...prev,
        selectedDates: new Set(),
        weekdayHours: new Map(),
        step: "confirmation",
      }));
    } else if (currentStep === "working-hours") {
      // Skip working-hours - go to confirmation with default hours
      setState((prev) => ({
        ...prev,
        weekdayHours: new Map(),
        step: "confirmation",
      }));
    } else {
      handleNext();
    }
  };

  // Step-specific props for legacy steps
  const stepProps = {
    state,
    onUpdate: handleUpdate,
    onNext: handleNext,
    onBack: handleBack,
    onSkip: handleSkip,
  };

  // Determine visible step count for progress (working-hours may be hidden)
  const getVisibleStepCount = () => {
    // If working-days was skipped, working-hours won't be shown
    // But for simplicity, we always show 7 dots
    return TOTAL_STEPS;
  };

  return (
    <main className="min-h-screen bg-surface">
      {/* Error from creation */}
      {error && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-danger/10 px-4 py-3 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {/* Step content */}
      {state.step === "intro" && (
        <StepIntro totalSteps={getVisibleStepCount()} onNext={handleNext} />
      )}

      {state.step === "name" && (
        <StepName
          name={state.name}
          totalSteps={getVisibleStepCount()}
          onUpdate={(name) => handleUpdate({ name })}
          onNext={handleNext}
          onPrevious={handleBack}
        />
      )}

      {state.step === "nickname" && (
        <StepNickname
          name={state.name}
          nickname={state.nickname}
          totalSteps={getVisibleStepCount()}
          onUpdate={(nickname) => handleUpdate({ nickname })}
          onNext={handleNext}
          onPrevious={handleBack}
        />
      )}

      {state.step === "services" && <StepServices {...stepProps} />}

      {state.step === "working-days" && <StepSelectDays {...stepProps} />}

      {state.step === "working-hours" && <StepConfigureHours {...stepProps} />}

      {state.step === "confirmation" && (
        <StepConfirmation
          state={state}
          totalSteps={getVisibleStepCount()}
          onPrevious={handleBack}
          onSubmit={handleCreate}
          isSubmitting={isPending}
        />
      )}
    </main>
  );
}
