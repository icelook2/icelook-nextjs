import { addDays, subDays } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { getSpecialistProfileById } from "@/lib/queries/specialists";
import { PageHeader } from "@/lib/ui/page-header";
import { ScheduleView } from "./_components";
import { toDateString } from "./_lib/date-utils";
import { getScheduleData, getSpecialistByUserId } from "./_lib/queries";
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

  // Get specialist profile
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

  // Get specialist ID from specialists table (needed for schedule data)
  // The schedule tables reference the specialists table, not beauty_page_specialist_profiles
  const specialistRecord = await getSpecialistByUserId(
    specialist.beauty_page_members.user_id,
  );

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

  // Fetch schedule data if specialist exists
  let workingDays: Awaited<ReturnType<typeof getScheduleData>>["workingDays"] =
    [];
  let appointments: Awaited<
    ReturnType<typeof getScheduleData>
  >["appointments"] = [];

  if (specialistRecord) {
    const scheduleData = await getScheduleData(
      specialistRecord.id,
      startDate,
      endDate,
    );
    workingDays = scheduleData.workingDays;
    appointments = scheduleData.appointments;
  }

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={displayName}
        backHref={`/${nickname}/settings/specialists/${id}`}
        containerClassName="mx-auto max-w-full px-4"
      />

      <main className="h-[calc(100vh-140px)] bg-gray-50 dark:bg-gray-950">
        {specialistRecord ? (
          <ScheduleView
            specialistId={specialistRecord.id}
            beautyPageId={beautyPage.id}
            nickname={nickname}
            workingDays={workingDays}
            appointments={appointments}
            canManage={canManage}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted">{t("no_specialist_profile")}</p>
              <p className="mt-2 text-sm text-muted">
                {t("no_specialist_profile_hint")}
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
