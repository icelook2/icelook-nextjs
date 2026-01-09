import { Calendar, Heart, Mail, Palette, Sparkles, User } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageTypes } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { SettingsItem } from "@/lib/ui/settings-item";
import { CreateBeautyPageSection } from "./_components/create-beauty-page-section";
import { LogoutButton } from "./_components/logout-button";
import { UserProfileHeader } from "./_components/user-profile-header";

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/auth");
  }

  const beautyPageTypes = await getBeautyPageTypes();
  const t = await getTranslations("settings");

  const displayName = profile.full_name || t("unnamed_user");

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref=""
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* User Profile Header */}
          <UserProfileHeader
            name={displayName}
            avatarUrl={profile.avatar_url}
          />

          {/* Account */}
          <SettingsGroup title={t("groups.account")}>
            <SettingsItem
              href="/settings/name"
              icon={User}
              title={t("nav.name")}
              value={profile.full_name || t("not_set")}
              iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
              variant="grouped"
            />
            <SettingsItem
              href="/settings/email"
              icon={Mail}
              title={t("nav.email")}
              value={profile.email || t("not_set")}
              iconClassName="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
              variant="grouped"
              noBorder
            />
          </SettingsGroup>

          {/* Preferences */}
          <SettingsGroup title={t("groups.preferences")}>
            <SettingsItem
              href="/settings/preferences"
              icon={Palette}
              title={t("nav.preferences")}
              description={t("nav.preferences_description")}
              iconClassName="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
              variant="grouped"
            />
            <SettingsItem
              href="/settings/visit-preferences"
              icon={Heart}
              title={t("nav.visit_preferences")}
              description={t("nav.visit_preferences_description")}
              iconClassName="bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400"
              variant="grouped"
              noBorder
            />
          </SettingsGroup>

          {/* Activity */}
          <SettingsGroup title={t("groups.activity")}>
            <SettingsItem
              href="/appointments"
              icon={Calendar}
              title={t("nav.appointments")}
              description={t("nav.appointments_description")}
              iconClassName="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
              variant="grouped"
            />
            <SettingsItem
              href="/settings/beauty-pages"
              icon={Sparkles}
              title={t("nav.beauty_pages")}
              description={t("nav.beauty_pages_description")}
              iconClassName="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400"
              variant="grouped"
              noBorder
            />
          </SettingsGroup>

          {/* Business */}
          <SettingsGroup title={t("groups.business")}>
            <CreateBeautyPageSection beautyPageTypes={beautyPageTypes} />
          </SettingsGroup>

          {/* Logout */}
          <div className="px-4">
            <LogoutButton />
          </div>
        </div>
      </main>
    </>
  );
}
