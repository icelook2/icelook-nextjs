import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { EmailChangeSection } from "../_components/email-change-section";

export default async function EmailSettingsPage() {
  const profile = await getProfile();
  const t = await getTranslations("settings");

  if (!profile) {
    redirect("/auth");
  }

  return (
    <>
      <PageHeader
        title={t("email_page_title")}
        backHref="/settings"
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <SettingsGroup>
          <EmailChangeSection currentEmail={profile.email ?? ""} />
        </SettingsGroup>
      </div>
    </>
  );
}
