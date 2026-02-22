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
import { uploadAvatar } from "@/lib/storage/upload-avatar";
import { StepAvatar } from "./step-avatar";
import { StepConfirmation } from "./step-confirmation";
import { StepContacts } from "./step-contacts";
import { StepFirstWorkingDay } from "./step-first-working-day";
import { StepName } from "./step-name";
import { StepNickname } from "./step-nickname";
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

    startTransition(async () => {
      const result = await createBeautyPageFlow({
        name: state.name,
        nickname: state.nickname,
        instagram: state.instagram || null,
        telegram: state.telegram || null,
        phone: state.phone || null,
        services: servicesData,
        firstWorkingDay: state.firstWorkingDay,
      });

      if (result.success) {
        // Upload avatar if one was selected (fire and forget - don't block navigation)
        if (state.avatarFile) {
          uploadAvatar(state.avatarFile, {
            type: "beauty-page",
            beautyPageId: result.beautyPageId,
          }).catch((err) => {
            // Log error but don't block - user can update avatar later in settings
            console.error("Failed to upload avatar:", err);
          });
        }

        // Clean up preview URL
        if (state.avatarPreviewUrl) {
          URL.revokeObjectURL(state.avatarPreviewUrl);
        }

        router.push(`/${result.nickname}`);
      } else {
        setError(result.error);
      }
    });
  };

  // Handle skip button (for optional steps)
  const handleSkip = () => {
    const currentStep = state.step;

    if (currentStep === "avatar") {
      // Clear avatar and move to contacts step
      if (state.avatarPreviewUrl) {
        URL.revokeObjectURL(state.avatarPreviewUrl);
      }
      setState((prev) => ({
        ...prev,
        avatarFile: null,
        avatarPreviewUrl: null,
        step: "contacts",
      }));
    } else if (currentStep === "contacts") {
      // Clear all contacts and move to services step
      setState((prev) => ({
        ...prev,
        instagram: "",
        telegram: "",
        phone: "",
        step: "services",
      }));
    } else if (currentStep === "services") {
      // Clear services and move to first working day step
      setState((prev) => ({
        ...prev,
        services: [],
        step: "first-working-day",
      }));
    } else if (currentStep === "first-working-day") {
      // Skip first working day - go directly to confirmation
      setState((prev) => ({
        ...prev,
        firstWorkingDay: null,
        step: "confirmation",
      }));
    } else {
      handleNext();
    }
  };

  return (
    <main>
      {/* Error from creation */}
      {error && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-danger/10 px-4 py-3 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {/* Step content */}
      {state.step === "name" && (
        <StepName
          name={state.name}
          totalSteps={TOTAL_STEPS}
          onUpdate={(name) => handleUpdate({ name })}
          onNext={handleNext}
          onPrevious={handleBack}
        />
      )}

      {state.step === "nickname" && (
        <StepNickname
          name={state.name}
          nickname={state.nickname}
          totalSteps={TOTAL_STEPS}
          onUpdate={(nickname) => handleUpdate({ nickname })}
          onNext={handleNext}
          onPrevious={handleBack}
        />
      )}

      {state.step === "avatar" && (
        <StepAvatar
          name={state.name}
          nickname={state.nickname}
          avatarFile={state.avatarFile}
          avatarPreviewUrl={state.avatarPreviewUrl}
          totalSteps={TOTAL_STEPS}
          onUpdate={(avatarFile, avatarPreviewUrl) =>
            handleUpdate({ avatarFile, avatarPreviewUrl })
          }
          onNext={handleNext}
          onPrevious={handleBack}
          onSkip={handleSkip}
        />
      )}

      {state.step === "contacts" && (
        <StepContacts
          name={state.name}
          nickname={state.nickname}
          avatarPreviewUrl={state.avatarPreviewUrl}
          instagram={state.instagram}
          telegram={state.telegram}
          phone={state.phone}
          totalSteps={TOTAL_STEPS}
          onUpdate={(contacts) => handleUpdate(contacts)}
          onNext={handleNext}
          onPrevious={handleBack}
          onSkip={handleSkip}
        />
      )}

      {state.step === "services" && (
        <StepServices
          name={state.name}
          nickname={state.nickname}
          avatarPreviewUrl={state.avatarPreviewUrl}
          services={state.services}
          totalSteps={TOTAL_STEPS}
          onUpdate={(services) => handleUpdate({ services })}
          onNext={handleNext}
          onPrevious={handleBack}
          onSkip={handleSkip}
        />
      )}

      {state.step === "first-working-day" && (
        <StepFirstWorkingDay
          firstWorkingDay={state.firstWorkingDay}
          totalSteps={TOTAL_STEPS}
          onUpdate={(firstWorkingDay) => handleUpdate({ firstWorkingDay })}
          onNext={handleNext}
          onPrevious={handleBack}
          onSkip={handleSkip}
        />
      )}

      {state.step === "confirmation" && (
        <StepConfirmation
          name={state.name}
          nickname={state.nickname}
          avatarPreviewUrl={state.avatarPreviewUrl}
          services={state.services}
          totalSteps={TOTAL_STEPS}
          onPrevious={handleBack}
          onSubmit={handleCreate}
          isSubmitting={isPending}
        />
      )}
    </main>
  );
}
