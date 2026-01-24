import { ClientDetailContent } from "../../_shared/client-detail-content";

interface BlockedClientDetailPageProps {
  params: Promise<{ nickname: string; clientId: string }>;
}

export default async function BlockedClientDetailPage({
  params,
}: BlockedClientDetailPageProps) {
  const { nickname, clientId } = await params;

  return (
    <ClientDetailContent
      nickname={nickname}
      clientId={clientId}
      backHref={`/${nickname}/settings/blocked-clients`}
      basePath={`/${nickname}/settings/blocked-clients/${clientId}`}
    />
  );
}
