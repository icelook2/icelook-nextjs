import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getClientDetails } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import {
  AppointmentsPagination,
  ServiceAppointmentsList,
  ServiceSettingsLink,
} from "../clients/[clientId]/services/[serviceName]/_components";

/** Number of appointments per page */
const PAGE_SIZE = 10;

interface ClientServiceDetailContentProps {
  nickname: string;
  clientId: string;
  serviceName: string;
  backHref: string;
  searchParams: {
    page?: string;
  };
}

/**
 * Shared content component for client service detail page.
 * Used by both /clients/[clientId]/services/[serviceName] and /blocked-clients/[clientId]/services/[serviceName] routes.
 */
export async function ClientServiceDetailContent({
  nickname,
  clientId,
  serviceName,
  backHref,
  searchParams,
}: ClientServiceDetailContentProps) {
  const t = await getTranslations("clients.service_detail");

  // Parse pagination params
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

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

  // Fetch client details
  const details = await getClientDetails(beautyPage.id, clientId);

  if (!details) {
    notFound();
  }

  // Filter appointments for this service
  const serviceAppointments = details.appointments.filter(
    (apt) => apt.serviceName === serviceName,
  );

  // If no appointments for this service, 404
  if (serviceAppointments.length === 0) {
    notFound();
  }

  // Get service stats from breakdown
  const serviceStats = details.servicesBreakdown.find(
    (s) => s.serviceName === serviceName,
  );

  // Paginate appointments
  const totalAppointments = serviceAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalAppointments / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedAppointments = serviceAppointments.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <>
      <PageHeader
        title={serviceName}
        subtitle={t("subtitle", { client: details.client.clientName })}
        backHref={backHref}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Service Settings Link */}
          <ServiceSettingsLink
            beautyPageId={beautyPage.id}
            serviceName={serviceName}
            nickname={nickname}
          />

          {/* Appointments List */}
          <ServiceAppointmentsList
            appointments={paginatedAppointments}
            totalCount={serviceStats?.count ?? totalAppointments}
            totalSpentCents={serviceStats?.totalCents ?? 0}
            currency={details.client.currency}
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
      </div>
    </>
  );
}
