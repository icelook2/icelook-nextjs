import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageAdmins,
  getBeautyPageByNickname,
  getBeautyPageInvitations,
} from "@/lib/queries";
import {
  getBeautyPageSpecialistProfiles,
  getNonSpecialistAdmins,
} from "@/lib/queries/specialists";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { PendingInvitations } from "../_components/pending-invitations";
import { revokeSpecialistInvitation } from "./_actions";
import {
  AddSpecialistDialog,
  InviteSpecialistDialog,
  SpecialistsList,
} from "./_components";

interface SpecialistsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function SpecialistsPage({
  params,
}: SpecialistsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("specialists");

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

  // Get specialist profiles
  const specialists = await getBeautyPageSpecialistProfiles(beautyPage.id);

  // Get pending specialist invitations
  const allInvitations = await getBeautyPageInvitations(beautyPage.id);
  const specialistInvitations = allInvitations.filter((inv) =>
    inv.roles.includes("specialist"),
  );

  // Get admins who are not specialists (for "make specialist" feature)
  const nonSpecialistAdmins = await getNonSpecialistAdmins(beautyPage.id);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      >
        <div className="flex items-center gap-2">
          <AddSpecialistDialog
            admins={nonSpecialistAdmins}
            beautyPageId={beautyPage.id}
            nickname={nickname}
          />
          <InviteSpecialistDialog
            beautyPageId={beautyPage.id}
            nickname={nickname}
          />
        </div>
      </PageHeader>

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Pending Invitations */}
          <PendingInvitations
            invitations={specialistInvitations}
            beautyPageId={beautyPage.id}
            nickname={nickname}
            translationKey="specialists"
            onRevoke={revokeSpecialistInvitation}
          />

          {/* Specialists List */}
          <SettingsGroup title={`${t("specialists")} (${specialists.length})`}>
            <SpecialistsList specialists={specialists} nickname={nickname} />
          </SettingsGroup>
        </div>
      </main>
    </>
  );
}
