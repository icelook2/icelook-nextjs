import { addDays, isValid, parseISO } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getBeautyPageClients } from "@/lib/queries";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { PageHeader } from "@/lib/ui/page-header";
import { FreeSlotsView } from "./_components";
import { toDateString } from "./_lib/date-utils";
import { getScheduleData } from "./_lib/queries";
import { getAppointmentsForDate } from "./_lib/workday-utils";

interface AppointmentsPageProps {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function AppointmentsPage({
  params,
  searchParams,
}: AppointmentsPageProps) {
  const { nickname } = await params;
  const { date: dateParam } = await searchParams;

  // Default to tomorrow
  let selectedDate = addDays(new Date(), 1);
  if (dateParam) {
    const parsed = parseISO(dateParam);
    if (isValid(parsed)) {
      selectedDate = parsed;
    }
  }

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access this view
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch real schedule data
  const dateStr = toDateString(selectedDate);
  const [scheduleData, serviceGroups, clientsResult] = await Promise.all([
    getScheduleData(beautyPage.id, dateStr, dateStr),
    getServiceGroupsWithServices(beautyPage.id),
    getBeautyPageClients(beautyPage.id, { limit: 50 }),
  ]);

  const { appointments, workingDays } = scheduleData;

  // Get working day for selected date
  const workingDay = workingDays.find((wd) => wd.date === dateStr) ?? null;

  // Get appointments for selected date
  const dayAppointments = getAppointmentsForDate(appointments, dateStr);

  // Working hours - use working day if configured, otherwise default
  const startTime = workingDay?.start_time ?? "09:00";
  const endTime = workingDay?.end_time ?? "21:00";
  const breaks = workingDay?.breaks ?? [];

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <FreeSlotsView
          selectedDate={selectedDate}
          startTime={startTime}
          endTime={endTime}
          breaks={breaks}
          appointments={dayAppointments}
          nickname={nickname}
          isConfigured={workingDay !== null}
          beautyPageId={beautyPage.id}
          serviceGroups={serviceGroups}
          clients={clientsResult.clients}
          currency="UAH"
        />
      </main>
    </>
  );
}
