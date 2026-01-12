import { addDays, isValid, parseISO } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { CreateScheduleButton, ScheduleView } from "./_components";
import { toDateString } from "./_lib/date-utils";
import { getScheduleData } from "./_lib/queries";
import { getAppointmentsForDate } from "./_lib/workday-utils";

interface AppointmentsPageProps {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ date?: string }>;
}

/**
 * Calculate day statistics: appointment count and expected earnings
 */
function calculateDayStats(
  appointments: Array<{
    status: string;
    service_price_cents: number;
    service_currency: string;
  }>,
) {
  // Include pending and confirmed appointments in stats
  const relevantAppointments = appointments.filter(
    (apt) => apt.status === "pending" || apt.status === "confirmed",
  );

  const totalEarningsCents = relevantAppointments.reduce(
    (sum, apt) => sum + apt.service_price_cents,
    0,
  );

  // Get currency from first appointment, or default
  const currency = appointments[0]?.service_currency ?? "UAH";

  return {
    appointmentCount: relevantAppointments.length,
    totalEarningsCents,
    currency,
  };
}

export default async function AppointmentsPage({
  params,
  searchParams,
}: AppointmentsPageProps) {
  const { nickname } = await params;
  const { date: dateParam } = await searchParams;

  // Parse date from URL or use today
  let selectedDate = new Date();
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

  // Solo creator model: only owner can access appointments view
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch schedule data for selected date + 30 days
  const startDate = toDateString(selectedDate);
  const endDate = toDateString(addDays(selectedDate, 30));

  const { appointments } = await getScheduleData(
    beautyPage.id,
    startDate,
    endDate,
  );

  // Get appointments for the selected date
  const dayAppointments = getAppointmentsForDate(appointments, startDate);

  // Calculate day statistics
  const dayStats = calculateDayStats(dayAppointments);

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      >
        <CreateScheduleButton />
      </PageHeader>

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <ScheduleView
          beautyPageId={beautyPage.id}
          nickname={nickname}
          appointments={appointments}
          selectedDate={selectedDate}
          dayStats={dayStats}
        />
      </main>
    </>
  );
}
