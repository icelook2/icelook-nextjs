import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageByNickname,
  getServiceById,
  getServiceGroupById,
} from "@/lib/queries";
import { getBundlesForService } from "@/lib/queries/bundles";
import { getPromotionsForService } from "@/lib/queries/promotions";
import { getResourcesForService } from "@/lib/queries/resources";
import { PageHeader } from "@/lib/ui/page-header";
import { ServiceDetails } from "./_components";

interface ServiceDetailsPageProps {
  params: Promise<{ nickname: string; groupId: string; serviceId: string }>;
}

export default async function ServiceDetailsPage({
  params,
}: ServiceDetailsPageProps) {
  const { nickname, groupId, serviceId } = await params;

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  // Only owner can access settings
  if (!profile || profile.id !== beautyPage.owner_id) {
    redirect(`/${nickname}`);
  }

  const [serviceGroup, service, promotions, bundles, resources] =
    await Promise.all([
      getServiceGroupById(groupId),
      getServiceById(serviceId),
      getPromotionsForService(serviceId),
      getBundlesForService(serviceId),
      getResourcesForService(serviceId),
    ]);

  if (!serviceGroup || serviceGroup.beauty_page_id !== beautyPage.id) {
    notFound();
  }

  if (!service || service.service_group_id !== groupId) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={service.name}
        subtitle={serviceGroup.name}
        backHref={`/${nickname}/settings/service-groups/${groupId}/services`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <ServiceDetails
          service={service}
          serviceGroup={serviceGroup}
          nickname={nickname}
          promotions={promotions}
          bundles={bundles}
          serviceResources={resources}
        />
      </div>
    </>
  );
}
