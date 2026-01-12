import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getAppointmentsPaginated,
  getBeautyPageByNickname,
  getClientDetails,
} from "@/lib/queries";
import type { AppointmentsSortField, SortOrder } from "@/lib/queries/clients";
import { PageHeader } from "@/lib/ui/page-header";
import { AppointmentsPagination, AppointmentsTable } from "./_components";

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
  const t = await getTranslations("clients.appointments_page");

  // Validate and parse search params
  const sort = (["date", "service", "price"].includes(query.sort ?? "")
    ? query.sort
    : "date") as AppointmentsSortField;
  const order = (["asc", "desc"].includes(query.order ?? "")
    ? query.order
    : "desc") as SortOrder;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);

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

  // Fetch client details (for name in header)
  const details = await getClientDetails(beautyPage.id, clientId);

  if (!details) {
    notFound();
  }

  // Fetch paginated appointments
  const { appointments, totalPages, currentPage } =
    await getAppointmentsPaginated(beautyPage.id, clientId, {
      sort,
      order,
      page,
    });

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle", { client: details.client.clientName })}
        backHref={`/${nickname}/settings/clients/${clientId}`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Appointments Table */}
          <AppointmentsTable
            appointments={appointments}
            sort={sort}
            order={order}
            nickname={nickname}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <AppointmentsPagination
              currentPage={currentPage}
              totalPages={totalPages}
            />
          )}
        </div>
      </main>
    </>
  );
}
