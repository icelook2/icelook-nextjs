import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageByNickname,
  getServiceGroupsWithServices,
} from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { ServicesManager } from "./_components";

interface ServicesPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { nickname } = await params;
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

  const serviceGroups = await getServiceGroupsWithServices(beautyPage.id);

  return (
    <>
      <PageHeader
        title={t("services_page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <ServicesManager
          serviceGroups={serviceGroups}
          beautyPageId={beautyPage.id}
          nickname={nickname}
        />
      </div>
    </>
  );
}
