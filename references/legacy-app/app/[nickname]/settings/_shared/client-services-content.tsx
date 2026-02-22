import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageByNickname,
  getClientDetails,
  getServicePreferencesPaginated,
} from "@/lib/queries";
import type {
  ServicePreferencesSortField,
  SortOrder,
} from "@/lib/queries/clients";
import { PageHeader } from "@/lib/ui/page-header";
import {
  ServicesPagination,
  ServicesSearch,
  ServicesTable,
} from "../clients/[clientId]/services/_components";

interface ClientServicesContentProps {
  nickname: string;
  clientId: string;
  backHref: string;
  /** Base path for service detail links (e.g., "/nickname/settings/clients/123" or "/nickname/settings/blocked-clients/123") */
  basePath: string;
  searchParams: {
    search?: string;
    sort?: string;
    order?: string;
    page?: string;
  };
}

/**
 * Shared content component for client services page.
 * Used by both /clients/[clientId]/services and /blocked-clients/[clientId]/services routes.
 */
export async function ClientServicesContent({
  nickname,
  clientId,
  backHref,
  basePath,
  searchParams,
}: ClientServicesContentProps) {
  const t = await getTranslations("clients.services_page");

  // Validate and parse search params
  const search = searchParams.search ?? "";
  const sort = (
    ["count", "total", "name"].includes(searchParams.sort ?? "")
      ? searchParams.sort
      : "count"
  ) as ServicePreferencesSortField;
  const order = (
    ["asc", "desc"].includes(searchParams.order ?? "")
      ? searchParams.order
      : "desc"
  ) as SortOrder;
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

  // Fetch client details for the header
  const details = await getClientDetails(beautyPage.id, clientId);

  if (!details) {
    notFound();
  }

  // Fetch paginated service preferences
  const result = await getServicePreferencesPaginated(beautyPage.id, clientId, {
    search: search || undefined,
    sort,
    order,
    page,
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle", { client: details.client.clientName })}
        backHref={backHref}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-4">
          {/* Search */}
          <ServicesSearch defaultValue={search} />

          {/* Table */}
          <ServicesTable
            services={result.services}
            currency={details.client.currency}
            nickname={nickname}
            clientId={clientId}
            sort={sort}
            order={order}
            search={search}
            basePath={basePath}
          />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <ServicesPagination
              currentPage={result.currentPage}
              totalPages={result.totalPages}
            />
          )}
        </div>
      </div>
    </>
  );
}
