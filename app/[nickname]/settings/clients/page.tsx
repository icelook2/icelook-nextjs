import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getBeautyPageClients } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import {
  getBlockedClientsForPage,
  getNoShowRecordsForPage,
} from "./_actions/blocklist.actions";
import { BlockedClientsList, ClientsList } from "./_components";

interface ClientsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function ClientsPage({ params }: ClientsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("clients");

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

  // Fetch initial batch of clients (no search, first page)
  const [{ clients, total, hasMore, pageSize }, blockedClients, noShowRecords] =
    await Promise.all([
      getBeautyPageClients(beautyPage.id),
      getBlockedClientsForPage(beautyPage.id),
      getNoShowRecordsForPage(beautyPage.id),
    ]);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-8 px-4 pb-8">
        <ClientsList
          initialClients={clients}
          initialTotal={total}
          initialHasMore={hasMore}
          pageSize={pageSize}
          nickname={nickname}
        />

        {/* Blocked Clients Section */}
        <BlockedClientsList
          beautyPageId={beautyPage.id}
          blockedClients={blockedClients}
          noShowRecords={noShowRecords}
        />
      </div>
    </>
  );
}
