import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { PageHeader } from "@/lib/ui/page-header";
import { VisitPreferencesForm } from "./_components/visit-preferences-form";

export default async function VisitPreferencesPage() {
  const profile = await getProfile();
  const t = await getTranslations("settings");

  if (!profile) {
    redirect("/auth");
  }

  return (
    <>
      <PageHeader
        title={t("visit_preferences_title")}
        subtitle={t("visit_preferences_page_description")}
        backHref="/settings"
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <VisitPreferencesForm initialPreferences={profile.visit_preferences} />
      </div>
    </>
  );
}
