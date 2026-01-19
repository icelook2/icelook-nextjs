import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getServiceGroupById } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { EditNameForm } from "./_components";

interface EditGroupNamePageProps {
  params: Promise<{ nickname: string; groupId: string }>;
}

export default async function EditGroupNamePage({
  params,
}: EditGroupNamePageProps) {
  const { nickname, groupId } = await params;
  const t = await getTranslations("service_groups");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

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
        title={t("edit_group_name")}
        backHref={`/${nickname}/settings/service-groups/${groupId}/services`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <SettingsGroup>
          <SettingsRow noBorder>
            <EditNameForm
              serviceGroupId={serviceGroup.id}
              beautyPageId={beautyPage.id}
              nickname={nickname}
              initialName={serviceGroup.name}
            />
          </SettingsRow>
        </SettingsGroup>
      </div>
    </>
  );
}
