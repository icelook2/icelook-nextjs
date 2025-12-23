import { addDays, subDays } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { getSpecialistProfileById } from "@/lib/queries/specialists";
import { PageHeader } from "@/lib/ui/page-header";
import { ScheduleView } from "./_components";
import { toDateString } from "./_lib/date-utils";
import { getScheduleData } from "./_lib/queries";
import type { ViewMode } from "./_lib/types";

interface SchedulePageProps {
  params: Promise<{ nickname: string; id: string }>;
  searchParams: Promise<{ view?: string; date?: string }>;
}

export default async function SchedulePage({
  params,
  searchParams,
}: SchedulePageProps) {
  const { nickname, id } = await params;
  const { view, date } = await searchParams;
  const t = await getTranslations("schedule");

  // Get beauty page
  const beautyPage = await getBeautyPageByNickname(nickname);
  if (!beautyPage) {
    notFound();
  }

  // Get current user profile
  const profile = await getProfile();
  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Check if user is owner or admin
  const isOwner = profile.id === beautyPage.owner_id;
  const admins = await getBeautyPageAdmins(beautyPage.id);
  const userIsAdmin = admins.some((a) => a.user_id === profile.id);

  // Get specialist profile (beauty_page_specialists table)
  const specialist = await getSpecialistProfileById(id);
  if (!specialist) {
    notFound();
  }

  // Check if user is the specialist themselves
  const isOwnSchedule = specialist.beauty_page_members.user_id === profile.id;

  // Determine access level
  const canManage = isOwner || userIsAdmin;
  const canView = canManage || isOwnSchedule;

  if (!canView) {
    redirect(`/${nickname}`);
  }

  // Calculate display name
  const displayName =
    specialist.display_name ||
    specialist.beauty_page_members.profiles?.full_name ||
    t("unnamed_specialist");

  // Parse view mode and date from URL
  const viewMode: ViewMode = (view as ViewMode) ?? "week";
  const currentDate = date ? new Date(date) : new Date();

  // Calculate date range based on view mode
  const daysToFetch = viewMode === "day" ? 1 : viewMode === "3days" ? 3 : 7;
  const startDate = toDateString(subDays(currentDate, 1)); // Buffer for week calculations
  const endDate = toDateString(addDays(currentDate, daysToFetch + 7)); // Buffer ahead

  // Fetch schedule data using beauty_page_specialists.id
  const { workingDays, appointments } = await getScheduleData(
    specialist.id,
    startDate,
    endDate,
  );

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={displayName}
        backHref={`/${nickname}/settings/specialists/${id}`}
        containerClassName="mx-auto max-w-full px-4"
      />

      <main className="bg-background px-4 pb-4">
        <ScheduleView
          specialistId={specialist.id}
          beautyPageId={beautyPage.id}
          nickname={nickname}
          workingDays={workingDays}
          appointments={appointments}
          canManage={canManage}
        />
      </main>
    </>
  );
}
