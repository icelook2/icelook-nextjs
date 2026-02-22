import { ClientServiceDetailContent } from "../../../../_shared/client-service-detail-content";

interface ServiceDetailPageProps {
  params: Promise<{ nickname: string; clientId: string; serviceName: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: ServiceDetailPageProps) {
  const { nickname, clientId, serviceName: encodedServiceName } = await params;
  const query = await searchParams;
  const serviceName = decodeURIComponent(encodedServiceName);

  return (
    <ClientServiceDetailContent
      nickname={nickname}
      clientId={clientId}
      serviceName={serviceName}
      backHref={`/${nickname}/settings/clients/${clientId}`}
      searchParams={query}
    />
  );
}
