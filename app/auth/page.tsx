import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { IcelookLogo } from "@/components/icelook-logo";
import { Paper } from "@/lib/ui/paper";
import { AuthForm } from "./_components/auth-form";

export default async function AuthPage() {
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
          <Suspense fallback={<AuthFormSkeleton />}>
            <AuthForm />
          </Suspense>
        </Paper>

        {/* Legal Links */}
        <p className="mt-4 text-center text-xs text-muted">
          {t("legal_agreement")}{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            {t("terms_of_service")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            {t("privacy_policy")}
          </Link>
        </p>
      </div>

      {/* Copyright */}
      <p className="mt-8 text-center text-xs text-muted">
        {t("copyright", { year: currentYear })}
      </p>
    </main>
  );
}

function AuthFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="mx-auto h-7 w-32 rounded-lg bg-border" />
      <div className="mx-auto h-4 w-48 rounded-lg bg-border" />
      <div className="space-y-1.5 pt-4">
        <div className="h-4 w-16 rounded bg-border" />
        <div className="h-12 rounded-2xl bg-border" />
      </div>
      <div className="h-12 rounded-2xl bg-border" />
    </div>
  );
}
