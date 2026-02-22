import { ClientServicesContent } from "../../../_shared/client-services-content";

interface BlockedClientServicesPageProps {
  params: Promise<{ nickname: string; clientId: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

export default async function BlockedClientServicesPage({
  params,
  searchParams,
}: BlockedClientServicesPageProps) {
  const { nickname, clientId } = await params;
  const query = await searchParams;

  return (
    <ClientServicesContent
      nickname={nickname}
      clientId={clientId}
      backHref={`/${nickname}/settings/blocked-clients/${clientId}`}
      basePath={`/${nickname}/settings/blocked-clients/${clientId}`}
      searchParams={query}
    />
  );
}
