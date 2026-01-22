import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getClientAppointmentDates,
  getClientAppointments,
  getClientAppointmentsByDate,
  getClientPastAppointments,
} from "@/lib/queries/appointments";
import { PageHeader } from "@/lib/ui/page-header";
import { AppointmentsList, CalendarFilter } from "./_components";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const { date: filterDate } = await searchParams;
  const t = await getTranslations("appointments");
  const profile = await getProfile();

  if (!profile) {
    redirect("/auth");
  }

  // Fetch appointment dates for calendar and appointments data
  const [
    appointmentDates,
    { upcoming },
    { results: initialPast, hasMore: initialHasMore },
    filteredAppointments,
  ] = await Promise.all([
    getClientAppointmentDates(profile.id),
    getClientAppointments(profile.id),
    getClientPastAppointments(profile.id),
    filterDate ? getClientAppointmentsByDate(profile.id, filterDate) : null,
  ]);

  // If filtering by date, use filtered data; otherwise use regular data
  const isFiltered = !!filterDate && filteredAppointments !== null;

  // Calendar filter translations
  const tSchedule = await getTranslations("creator_schedule");
  const calendarFilterTranslations = {
    weekdays: {
      mo: tSchedule("weekdays.mo"),
      tu: tSchedule("weekdays.tu"),
      we: tSchedule("weekdays.we"),
      th: tSchedule("weekdays.th"),
      fr: tSchedule("weekdays.fr"),
      sa: tSchedule("weekdays.sa"),
      su: tSchedule("weekdays.su"),
    },
    clearFilter: t("clear_filter"),
  };

  // Convert Set to array for serialization to client component
  const appointmentDatesArray = Array.from(appointmentDates);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={
          isFiltered
            ? t("filtered_subtitle", { date: filterDate })
            : t("subtitle")
        }
        containerClassName="mx-auto max-w-2xl"
      >
        <CalendarFilter
          appointmentDates={appointmentDatesArray}
          translations={calendarFilterTranslations}
        />
      </PageHeader>

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <AppointmentsList
          upcoming={isFiltered ? filteredAppointments : upcoming}
          initialPast={isFiltered ? [] : initialPast}
          initialHasMore={isFiltered ? false : initialHasMore}
          isFiltered={isFiltered}
        />
      </div>
    </>
  );
}
