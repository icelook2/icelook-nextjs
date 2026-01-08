import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { getBeautyPageAnalytics } from "@/lib/queries/analytics";
import { PageHeader } from "@/lib/ui/page-header";
import {
  AnalyticsDashboard,
  AnalyticsProvider,
  PeriodSelect,
} from "./_components";
import type { AnalyticsPeriod } from "./_lib/types";

interface AnalyticsPageProps {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{
    period?: string;
  }>;
}

const VALID_PERIODS: AnalyticsPeriod[] = [
  "today",
  "yesterday",
  "this_week",
  "last_7_days",
  "this_month",
  "last_30_days",
  "this_quarter",
  "last_quarter",
  "this_year",
  "last_year",
  "all_time",
];

export default async function AnalyticsPage({
  params,
  searchParams,
}: AnalyticsPageProps) {
  const { nickname } = await params;
  const { period } = await searchParams;
  const t = await getTranslations("analytics");

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

  // Parse period from URL (default to last_30_days)
  const selectedPeriod: AnalyticsPeriod = VALID_PERIODS.includes(
    period as AnalyticsPeriod,
  )
    ? (period as AnalyticsPeriod)
    : "last_30_days";

  // Fetch analytics data
  const analytics = await getBeautyPageAnalytics(beautyPage.id, selectedPeriod);

  return (
    <AnalyticsProvider analytics={analytics} nickname={nickname}>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      >
        <PeriodSelect />
      </PageHeader>

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <AnalyticsDashboard />
      </main>
    </AnalyticsProvider>
  );
}
