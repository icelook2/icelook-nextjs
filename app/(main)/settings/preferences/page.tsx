import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { PreferencesSection } from "../_components/preferences-section";

export default async function PreferencesPage() {
  const profile = await getProfile();
  const t = await getTranslations("settings");

  if (!profile) {
    redirect("/auth");
  }

  return (
    <>
      <PageHeader
        title={t("preferences_title")}
        subtitle={t("preferences_description")}
        backHref="/settings"
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <SettingsGroup>
          <PreferencesSection />
        </SettingsGroup>
      </div>
    </>
  );
}
