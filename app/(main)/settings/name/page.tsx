import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { ProfileSection } from "../_components/profile-section";

export default async function NameSettingsPage() {
  const profile = await getProfile();
  const t = await getTranslations("settings");

  if (!profile) {
    redirect("/auth");
  }

  return (
    <>
      <PageHeader
        title={t("name_page_title")}
        backHref="/settings"
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <SettingsGroup>
          <SettingsRow noBorder>
            <ProfileSection initialName={profile.full_name ?? ""} />
          </SettingsRow>
        </SettingsGroup>
      </div>
    </>
  );
}
