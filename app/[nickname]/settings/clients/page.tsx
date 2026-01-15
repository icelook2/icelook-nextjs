import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getBeautyPageClients } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { ClientsList } from "./_components";

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
  const { clients, total, hasMore, pageSize } = await getBeautyPageClients(
    beautyPage.id,
  );

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <ClientsList
          initialClients={clients}
          initialTotal={total}
          initialHasMore={hasMore}
          pageSize={pageSize}
          nickname={nickname}
        />
      </main>
    </>
  );
}
