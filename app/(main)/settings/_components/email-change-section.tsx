"use client";

import { useState } from "react";
import { EmailChangeForm } from "./email-change-form";
import { EmailChangePending } from "./email-change-pending";
import { EmailDisplay } from "./email-display";

type Step = "display" | "input" | "pending";

interface EmailChangeSectionProps {
  currentEmail: string;
}

export function EmailChangeSection({ currentEmail }: EmailChangeSectionProps) {
  const [step, setStep] = useState<Step>("display");
  const [newEmail, setNewEmail] = useState("");

  function handleStartChange() {
    setStep("input");
  }

  function handleCancel() {
    setStep("display");
  }

  function handleEmailSent(email: string) {
    setNewEmail(email);
    setStep("pending");
  }

  function handleDone() {
    setStep("display");
    setNewEmail("");
  }

  if (step === "display") {
    return (
      <EmailDisplay email={currentEmail} onChangeClick={handleStartChange} />
    );
  }

  if (step === "pending") {
    return (
      <EmailChangePending
        currentEmail={currentEmail}
        newEmail={newEmail}
        onDone={handleDone}
      />
    );
  }

  return (
    <EmailChangeForm
      currentEmail={currentEmail}
      onSuccess={handleEmailSent}
      onCancel={handleCancel}
    />
  );
}
