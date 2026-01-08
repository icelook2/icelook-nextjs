import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { IcelookLogo } from "@/components/icelook-logo";
import { getProfile, isOnboardingComplete } from "@/lib/auth/session";
import { Paper } from "@/lib/ui/paper";
import { OnboardingForm } from "./_components/onboarding-form";

export default async function OnboardingPage() {
  const t = await getTranslations("onboarding");
  const tAuth = await getTranslations("auth");
  const profile = await getProfile();
  const currentYear = new Date().getFullYear();

  // If already completed onboarding, redirect to home
  // (proxy also handles this, but this is a safeguard)
  if (profile && isOnboardingComplete(profile)) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-1 flex-col justify-center">
        {/* Branding */}
        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <IcelookLogo size={32} />
            <span className="text-xl font-semibold">Icelook</span>
          </div>
          <span className="text-sm text-muted">{tAuth("slogan")}</span>
        </div>

        {/* Onboarding Card */}
        <Paper className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold">{t("title")}</h1>
              <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
            </div>
            <OnboardingForm />
          </div>
        </Paper>
      </div>

      {/* Copyright */}
      <p className="mt-8 text-center text-xs text-muted">
        {tAuth("copyright", { year: currentYear })}
      </p>
    </main>
  );
}
