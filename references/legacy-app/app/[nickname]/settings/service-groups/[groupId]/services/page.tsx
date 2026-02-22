import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getServiceGroupById } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { ServicesList } from "./_components";

interface GroupServicesPageProps {
  params: Promise<{ nickname: string; groupId: string }>;
}

export default async function GroupServicesPage({
  params,
}: GroupServicesPageProps) {
  const { nickname, groupId } = await params;

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  // Only owner can access settings
  if (!profile || profile.id !== beautyPage.owner_id) {
    redirect(`/${nickname}`);
  }

  const serviceGroup = await getServiceGroupById(groupId);

  if (!serviceGroup || serviceGroup.beauty_page_id !== beautyPage.id) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={serviceGroup.name}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings/service-groups`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <ServicesList
          serviceGroup={serviceGroup}
          beautyPageId={beautyPage.id}
          nickname={nickname}
        />
      </div>
    </>
  );
}
