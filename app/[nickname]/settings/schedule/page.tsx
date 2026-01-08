import { addDays, subDays } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { ScheduleView } from "./_components";
import { getViewDates, parseDate, toDateString } from "./_lib/date-utils";
import { getScheduleData } from "./_lib/queries";
import type { ViewMode } from "./_lib/types";

interface SchedulePageProps {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ view?: string; date?: string }>;
}

export default async function SchedulePage({
  params,
  searchParams,
}: SchedulePageProps) {
  const { nickname } = await params;
  const { view, date } = await searchParams;
  const t = await getTranslations("schedule");

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

  // Parse view mode and date from URL
  const viewMode: ViewMode = (view as ViewMode) ?? "week";
  const currentDate = date ? parseDate(date) : new Date();

  // Calculate date range for fetching (add buffer for navigation)
  const viewDates = getViewDates(currentDate, viewMode);
  const startDate = toDateString(subDays(viewDates[0], 7));
  const endDate = toDateString(addDays(viewDates[viewDates.length - 1], 14));

  // Fetch schedule data
  const { workingDays, appointments } = await getScheduleData(
    beautyPage.id,
    startDate,
    endDate,
  );

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
      />

      <main className="overflow-hidden px-4 pb-8">
        <ScheduleView
          beautyPageId={beautyPage.id}
          nickname={nickname}
          workingDays={workingDays}
          appointments={appointments}
          canManage={isOwner}
        />
      </main>
    </>
  );
}
