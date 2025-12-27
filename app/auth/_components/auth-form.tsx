"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getSafeRedirect } from "@/lib/utils/redirect";
import { EmailStep } from "./email-step";
import { OtpStep } from "./otp-step";

type AuthStep = "email" | "otp";

export function AuthForm() {
  const t = useTranslations("auth");
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();

  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  function handleEmailSubmitted(submittedEmail: string) {
    setEmail(submittedEmail);
    setStep("otp");
  }

  function handleBackToEmail() {
    setStep("email");
  }

  return (
    <>
      <h1 className="text-2xl font-semibold  text-center mb-2">
        {step === "email" ? t("welcome") : t("check_email")}
      </h1>
      <p className=" text-center mb-8">
        {step === "email"
          ? t("enter_email_description")
          : t("code_sent", { email })}
      </p>

      {step === "email" && <EmailStep onSubmitted={handleEmailSubmitted} />}

      {step === "otp" && (
        <OtpStep
          email={email}
          redirectTo={redirectTo}
          onBack={handleBackToEmail}
        />
      )}
    </>
  );
}
