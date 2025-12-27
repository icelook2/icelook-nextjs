import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageTypes, getUserPendingInvitations } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const [profile, beautyPageTypes] = await Promise.all([
    getProfile(),
    getBeautyPageTypes(),
  ]);
  const t = await getTranslations("settings");

  // Fetch pending invitations count if user has email
  const pendingInvitations = profile?.email
    ? await getUserPendingInvitations(profile.email)
    : [];

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4">
        <SettingsForm
          initialName={profile?.full_name ?? ""}
          initialEmail={profile?.email ?? ""}
          beautyPageTypes={beautyPageTypes}
          pendingInvitationsCount={pendingInvitations.length}
        />
      </div>
    </>
  );
}
