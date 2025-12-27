import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile, isOnboardingComplete } from "@/lib/auth/session";
import { OnboardingForm } from "./_components/onboarding-form";

export default async function OnboardingPage() {
  const t = await getTranslations("onboarding");
  const profile = await getProfile();

  // If already completed onboarding, redirect to home
  // (proxy also handles this, but this is a safeguard)
  if (profile && isOnboardingComplete(profile)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-semibold">
          {t("title")}
        </h1>
        <p className="mb-8 text-center">{t("subtitle")}</p>
        <OnboardingForm />
      </div>
    </div>
  );
}
