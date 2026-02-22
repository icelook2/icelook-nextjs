import {
  addMonths,
  isValid,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getBeautyPageClients } from "@/lib/queries";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { createClient } from "@/lib/supabase/server";
import { FreeSlotsView, ScheduleHeader } from "./_components";
import { toDateString } from "./_lib/date-utils";
import { getScheduleData } from "./_lib/queries";
import { getAppointmentsForDate } from "./_lib/workday-utils";

/**
 * Fetch all calendar dates in a single RPC call
 * Replaces 3 separate queries with 1 RPC
 */
async function fetchCalendarDates(
  beautyPageId: string,
  startDate: string,
  endDate: string,
): Promise<{
  workingDates: Set<string>;
  appointmentDates: Set<string>;
  pendingDates: Set<string>;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_calendar_dates", {
    p_beauty_page_id: beautyPageId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("Error fetching calendar dates:", error);
    return {
      workingDates: new Set(),
      appointmentDates: new Set(),
      pendingDates: new Set(),
    };
  }

  return {
    workingDates: new Set((data?.workingDates as string[]) ?? []),
    appointmentDates: new Set((data?.appointmentDates as string[]) ?? []),
    pendingDates: new Set((data?.pendingDates as string[]) ?? []),
  };
}

type FilterType = "all" | "confirmed" | "pending";

interface AppointmentsPageProps {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ date?: string; filter?: FilterType }>;
}

export default async function AppointmentsPage({
  params,
  searchParams,
}: AppointmentsPageProps) {
  const { nickname } = await params;
  const { date: dateParam, filter: filterParam } = await searchParams;
  const filter: FilterType =
    filterParam === "confirmed" || filterParam === "pending"
      ? filterParam
      : "all";

  // Default to today
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

  // Solo creator model: only owner can access this view
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch real schedule data
  const dateStr = toDateString(selectedDate);

  // Calendar date range (expanded to 12 months ahead for future working days visibility)
  const calendarStart = toDateString(subMonths(startOfMonth(selectedDate), 1));
  const calendarEnd = toDateString(addMonths(startOfMonth(selectedDate), 12));

  const [scheduleData, serviceGroups, clientsResult, calendarDates] =
    await Promise.all([
      getScheduleData(beautyPage.id, dateStr, dateStr),
      getServiceGroupsWithServices(beautyPage.id),
      getBeautyPageClients(beautyPage.id, { limit: 50 }),
      fetchCalendarDates(beautyPage.id, calendarStart, calendarEnd),
    ]);

  const {
    workingDates: workingDatesForCalendar,
    appointmentDates: appointmentDatesForCalendar,
    pendingDates: pendingDatesForCalendar,
  } = calendarDates;

  const { appointments, workingDays } = scheduleData;

  // Get working day for selected date
  const workingDay = workingDays.find((wd) => wd.date === dateStr) ?? null;

  // Get appointments for selected date
  const dayAppointments = getAppointmentsForDate(appointments, dateStr);

  // Working hours - use working day if configured, otherwise default
  const startTime = workingDay?.start_time ?? "09:00";
  const endTime = workingDay?.end_time ?? "21:00";
  const breaks = workingDay?.breaks ?? [];

  // Calculate appointment counts for header
  const activeAppointments = dayAppointments.filter(
    (apt) => apt.status !== "cancelled" && apt.status !== "no_show",
  );
  const appointmentCount = activeAppointments.length;
  const pendingCount = dayAppointments.filter(
    (apt) => apt.status === "pending",
  ).length;

  // Format working hours for display
  const workingHours = workingDay
    ? `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`
    : null;

  // Format working day info for ScheduleHeader menu
  const workingDayInfo = workingDay
    ? {
        id: workingDay.id,
        startTime: workingDay.start_time.slice(0, 5),
        endTime: workingDay.end_time.slice(0, 5),
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-8">
      <ScheduleHeader
        selectedDate={selectedDate}
        appointmentCount={appointmentCount}
        pendingCount={pendingCount}
        workingHours={workingHours}
        workingDay={workingDayInfo}
        beautyPageId={beautyPage.id}
        nickname={nickname}
        workingDates={workingDatesForCalendar}
        appointmentDates={appointmentDatesForCalendar}
        pendingDates={pendingDatesForCalendar}
        filter={filter}
      />

      <FreeSlotsView
        selectedDate={selectedDate}
        startTime={startTime}
        endTime={endTime}
        breaks={breaks}
        appointments={dayAppointments}
        nickname={nickname}
        isConfigured={workingDay !== null}
        slotIntervalMinutes={workingDay?.slot_interval_minutes ?? 30}
        beautyPageId={beautyPage.id}
        serviceGroups={serviceGroups}
        clients={clientsResult.clients}
        currency="UAH"
        filter={filter}
      />
    </div>
  );
}
