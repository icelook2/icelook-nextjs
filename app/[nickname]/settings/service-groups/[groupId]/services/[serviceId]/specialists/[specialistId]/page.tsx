import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageByNickname,
  getServiceById,
  getServiceGroupById,
  getSpecialistAssignmentById,
} from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SpecialistServiceDetails } from "./_components";

interface SpecialistServicePageProps {
  params: Promise<{
    nickname: string;
    groupId: string;
    serviceId: string;
    specialistId: string;
  }>;
}

export default async function SpecialistServicePage({
  params,
}: SpecialistServicePageProps) {
  const { nickname, groupId, serviceId, specialistId } = await params;
  const t = await getTranslations("service_groups");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  // Only owner can access settings
  if (!profile || profile.id !== beautyPage.owner_id) {
    redirect(`/${nickname}`);
  }

  const [serviceGroup, service, assignment] = await Promise.all([
    getServiceGroupById(groupId),
    getServiceById(serviceId),
    getSpecialistAssignmentById(specialistId),
  ]);

  if (!serviceGroup || serviceGroup.beauty_page_id !== beautyPage.id) {
    notFound();
  }

  if (!service || service.service_group_id !== groupId) {
    notFound();
  }

  if (!assignment || assignment.service_id !== serviceId) {
    notFound();
  }

  const specialistName =
    assignment.beauty_page_members.profiles.full_name ||
    t("unnamed_specialist");

  return (
    <>
      <PageHeader
        title={specialistName}
        subtitle={service.name}
        backHref={`/${nickname}/settings/service-groups/${groupId}/services/${serviceId}`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <SpecialistServiceDetails
          assignment={assignment}
          service={service}
          serviceGroup={serviceGroup}
          nickname={nickname}
        />
      </main>
    </>
  );
}
