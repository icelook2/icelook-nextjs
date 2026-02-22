import { ClientServicesContent } from "../../../_shared/client-services-content";

interface ServicesPageProps {
  params: Promise<{ nickname: string; clientId: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

export default async function ServicesPage({
  params,
  searchParams,
}: ServicesPageProps) {
  const { nickname, clientId } = await params;
  const query = await searchParams;

  return (
    <ClientServicesContent
      nickname={nickname}
      clientId={clientId}
      backHref={`/${nickname}/settings/clients/${clientId}`}
      basePath={`/${nickname}/settings/clients/${clientId}`}
      searchParams={query}
    />
  );
}
