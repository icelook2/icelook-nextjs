import { ClientAppointmentsContent } from "../../../_shared/client-appointments-content";

interface AppointmentsPageProps {
  params: Promise<{ nickname: string; clientId: string }>;
  searchParams: Promise<{
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

export default async function AppointmentsPage({
  params,
  searchParams,
}: AppointmentsPageProps) {
  const { nickname, clientId } = await params;
  const query = await searchParams;

  return (
    <ClientAppointmentsContent
      nickname={nickname}
      clientId={clientId}
      backHref={`/${nickname}/settings/clients/${clientId}`}
      searchParams={query}
    />
  );
}
