import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { getBlockedClientsForPage } from "../clients/_actions/blocklist.actions";
import { BlockedClientsList, BlockClientButton } from "./_components";

interface BlockedClientsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function BlockedClientsPage({
  params,
}: BlockedClientsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("blocked_clients");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  const blockedClients = await getBlockedClientsForPage(beautyPage.id);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        {/* Block Client Button */}
        <BlockClientButton beautyPageId={beautyPage.id} nickname={nickname} />

        {/* Blocked Clients List */}
        <BlockedClientsList
          beautyPageId={beautyPage.id}
          blockedClients={blockedClients}
          nickname={nickname}
        />
      </div>
    </>
  );
}
