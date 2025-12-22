import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { getSpecialistProfileById } from "@/lib/queries/specialists";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { AssignedServices } from "./_components/assigned-services";

interface SpecialistServicesPageProps {
  params: Promise<{ nickname: string; id: string }>;
}

export default async function SpecialistServicesPage({
  params,
}: SpecialistServicesPageProps) {
  const { nickname, id } = await params;
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

  const specialist = await getSpecialistProfileById(id);

  if (!specialist) {
    notFound();
  }

  const userProfile = specialist.beauty_page_members.profiles;
  const displayName =
    specialist.display_name ||
    userProfile?.full_name ||
    t("unnamed_specialist");

  const assignmentCount =
    specialist.specialist_service_assignments?.length ?? 0;

  return (
    <>
      <PageHeader
        title={t("assigned_services")}
        subtitle={`${displayName} · ${assignmentCount} ${assignmentCount === 1 ? t("service") : t("services")}`}
        backHref={`/${nickname}/settings/specialists/${id}`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <SettingsGroup>
          <AssignedServices
            assignments={specialist.specialist_service_assignments ?? []}
            nickname={nickname}
          />
        </SettingsGroup>
      </main>
    </>
  );
}
