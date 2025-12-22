import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageAdmins,
  getBeautyPageByNickname,
  getBeautyPageInvitations,
  getNonAdminSpecialists,
} from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { PendingInvitations } from "../_components/pending-invitations";
import { revokeAdminInvitation } from "./_actions";
import { AddAdminDialog, AdminsList, InviteAdminDialog } from "./_components";

interface AdminsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function AdminsPage({ params }: AdminsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("admins");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Check if user is owner or admin
  const isOwner = profile.id === beautyPage.owner_id;
  const admins = await getBeautyPageAdmins(beautyPage.id);
  const userIsAdmin = admins.some((a) => a.user_id === profile.id);

  if (!isOwner && !userIsAdmin) {
    redirect(`/${nickname}`);
  }

  // Get pending admin invitations (only those with admin role, not specialist-only)
  const allInvitations = await getBeautyPageInvitations(beautyPage.id);
  const adminInvitations = allInvitations.filter((inv) =>
    inv.roles.includes("admin"),
  );

  // Get specialists who are not admins (for "promote to admin" feature)
  const nonAdminSpecialists = await getNonAdminSpecialists(beautyPage.id);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      >
        <div className="flex items-center gap-2">
          <AddAdminDialog
            specialists={nonAdminSpecialists}
            beautyPageId={beautyPage.id}
            nickname={nickname}
          />
          <InviteAdminDialog beautyPageId={beautyPage.id} nickname={nickname} />
        </div>
      </PageHeader>

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Pending Invitations */}
          <PendingInvitations
            invitations={adminInvitations}
            beautyPageId={beautyPage.id}
            nickname={nickname}
            translationKey="admins"
            onRevoke={revokeAdminInvitation}
          />

          {/* Admins List */}
          <SettingsGroup title={`${t("admins")} (${admins.length})`}>
            <AdminsList
              admins={admins}
              ownerId={beautyPage.owner_id}
              beautyPageId={beautyPage.id}
              nickname={nickname}
              currentUserId={profile.id}
            />
          </SettingsGroup>
        </div>
      </main>
    </>
  );
}
