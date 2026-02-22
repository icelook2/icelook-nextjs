import { ClientServiceDetailContent } from "../../../../_shared/client-service-detail-content";

interface BlockedClientServiceDetailPageProps {
  params: Promise<{ nickname: string; clientId: string; serviceName: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function BlockedClientServiceDetailPage({
  params,
  searchParams,
}: BlockedClientServiceDetailPageProps) {
  const { nickname, clientId, serviceName: encodedServiceName } = await params;
  const query = await searchParams;
  const serviceName = decodeURIComponent(encodedServiceName);

  return (
    <ClientServiceDetailContent
      nickname={nickname}
      clientId={clientId}
      serviceName={serviceName}
      backHref={`/${nickname}/settings/blocked-clients/${clientId}`}
      searchParams={query}
    />
  );
}
