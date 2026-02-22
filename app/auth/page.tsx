import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { IcelookLogo } from "@/components/icelook-logo";
import { resolvePostLoginDestination } from "@/lib/auth/landing";
import { getUser } from "@/lib/auth/session";
import { Paper } from "@/lib/ui/paper";
import { AuthForm } from "./_components/auth-form";

export default async function AuthPage() {
  const user = await getUser();
  if (user) {
    redirect(await resolvePostLoginDestination(user.id));
  }

  const t = await getTranslations("auth");
  const currentYear = new Date().getFullYear();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-1 flex-col justify-center">
        {/* Branding */}
        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <IcelookLogo size={32} />
            <span className="text-xl font-semibold">Icelook</span>
          </div>
          <span className="text-sm text-muted">{t("slogan")}</span>
        </div>

        {/* Auth Card */}
        <Paper className="p-6">
          <AuthForm />
        </Paper>

        <p className="mt-4 text-center text-xs text-muted">{t("legal_agreement")}</p>
      </div>

      {/* Copyright */}
      <p className="mt-8 text-center text-xs text-muted">{t("copyright", { year: currentYear })}</p>
    </main>
  );
}
