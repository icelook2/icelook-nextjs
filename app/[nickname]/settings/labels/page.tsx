import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getBeautyPageLabelsWithCounts } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { LabelsList } from "./_components";

interface LabelsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function LabelsPage({ params }: LabelsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("labels");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  // Only owner or admin can access settings
  if (!profile || profile.id !== beautyPage.owner_id) {
    redirect(`/${nickname}`);
  }

  const labels = await getBeautyPageLabelsWithCounts(beautyPage.id);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <LabelsList
          labels={labels}
          beautyPageId={beautyPage.id}
          nickname={nickname}
        />
      </main>
    </>
  );
}
