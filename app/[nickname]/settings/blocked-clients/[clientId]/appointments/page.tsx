import { ClientAppointmentsContent } from "../../../_shared/client-appointments-content";

interface BlockedClientAppointmentsPageProps {
  params: Promise<{ nickname: string; clientId: string }>;
  searchParams: Promise<{
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

export default async function BlockedClientAppointmentsPage({
  params,
  searchParams,
}: BlockedClientAppointmentsPageProps) {
  const { nickname, clientId } = await params;
  const query = await searchParams;

  return (
    <ClientAppointmentsContent
      nickname={nickname}
      clientId={clientId}
      backHref={`/${nickname}/settings/blocked-clients/${clientId}`}
      searchParams={query}
    />
  );
}
