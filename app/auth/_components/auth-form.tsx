"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmailStep } from "./email-step";
import { OtpStep } from "./otp-step";

type AuthStep = "email" | "otp";

export function AuthForm() {
  const t = useTranslations("auth");
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");

  function handleEmailSubmitted(submittedEmail: string) {
    setEmail(submittedEmail);
    setStep("otp");
  }

  function handleBackToEmail() {
    setStep("email");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">
          {step === "email" ? t("welcome") : t("check_email")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {step === "email" ? t("enter_email_description") : t("code_sent", { email })}
        </p>
      </div>

      {step === "email" && <EmailStep onSubmitted={handleEmailSubmitted} />}

      {step === "otp" && <OtpStep email={email} onBack={handleBackToEmail} />}
    </div>
  );
}
