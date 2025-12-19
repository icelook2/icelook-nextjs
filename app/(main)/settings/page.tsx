import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const profile = await getProfile();
  const t = await getTranslations("settings");

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-foreground/60">{t("subtitle")}</p>
        </div>

        <SettingsForm
          initialName={profile?.full_name ?? ""}
          initialEmail={profile?.email ?? ""}
        />
      </div>
    </div>
  );
}
