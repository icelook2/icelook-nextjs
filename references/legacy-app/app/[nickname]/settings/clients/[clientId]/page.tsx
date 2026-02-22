import { ClientDetailContent } from "../../_shared/client-detail-content";

interface ClientDetailPageProps {
  params: Promise<{ nickname: string; clientId: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { nickname, clientId } = await params;

  return (
    <ClientDetailContent
      nickname={nickname}
      clientId={clientId}
      backHref={`/${nickname}/settings/clients`}
      basePath={`/${nickname}/settings/clients/${clientId}`}
    />
  );
}
