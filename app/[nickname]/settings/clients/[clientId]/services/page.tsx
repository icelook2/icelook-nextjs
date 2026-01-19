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
} from "./_components";

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
  const t = await getTranslations("clients.services_page");

  // Validate and parse search params
  const search = query.search ?? "";
  const sort = (
    ["count", "total", "name"].includes(query.sort ?? "") ? query.sort : "count"
  ) as ServicePreferencesSortField;
  const order = (
    ["asc", "desc"].includes(query.order ?? "") ? query.order : "desc"
  ) as SortOrder;
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
        backHref={`/${nickname}/settings/clients/${clientId}`}
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
