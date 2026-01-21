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
  const tBeautyPage = await getTranslations("beauty_page");
  const tBookingDialog = await getTranslations("beauty_page.booking");
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

  // Current user profile for booking
  const currentUserProfile = {
    name: profile.full_name ?? "",
    email: profile.email ?? null,
  };

  // Duration labels
  const durationLabels = {
    min: tBeautyPage("duration_min"),
    hour: tBeautyPage("duration_hour"),
  };

  // Month and weekday names from translations
  const monthNames = tBookingDialog.raw("date.month_names") as string[];
  const weekdayNames = tBookingDialog.raw("date.weekday_names") as string[];

  // Build quick booking translations
  const quickBookingTranslations = {
    serviceUnavailable: t("service_unavailable"),
    fetchError: t("fetch_error"),
    loading: t("loading_service"),
    close: t("close"),
    durationLabels,
    bookingDialog: {
      dialogTitle: tBookingDialog("dialog_title"),
      cancel: tBookingDialog("cancel"),
      steps: {
        date: {
          title: tBookingDialog("date.title"),
          subtitle: tBookingDialog("date.subtitle"),
          monthNames,
          weekdayNames,
          today: tBookingDialog("date.today"),
          loading: tBookingDialog("date.loading"),
          noAvailability: tBookingDialog("date.no_availability"),
          nextButton: tBookingDialog("date.next_button"),
        },
        time: {
          title: tBookingDialog("time.title"),
          subtitle: tBookingDialog("time.subtitle"),
          loading: tBookingDialog("time.loading"),
          noSlots: tBookingDialog("time.no_slots"),
          morning: tBookingDialog("time.morning"),
          afternoon: tBookingDialog("time.afternoon"),
          evening: tBookingDialog("time.evening"),
          nextButton: tBookingDialog("time.next_button"),
        },
        confirm: {
          title: tBookingDialog("confirm.title"),
          subtitle: tBookingDialog("confirm.subtitle"),
          summary: {
            who: tBookingDialog("confirm.summary.who"),
            when: tBookingDialog("confirm.summary.when"),
            where: tBookingDialog("confirm.summary.where"),
            what: tBookingDialog("confirm.summary.what"),
            price: tBookingDialog("confirm.summary.price"),
            duration: tBookingDialog("confirm.summary.duration"),
          },
          form: {
            name: tBookingDialog("confirm.form.name"),
            namePlaceholder: tBookingDialog("confirm.form.name_placeholder"),
            phone: tBookingDialog("confirm.form.phone"),
            phonePlaceholder: tBookingDialog("confirm.form.phone_placeholder"),
            email: tBookingDialog("confirm.form.email"),
            emailPlaceholder: tBookingDialog("confirm.form.email_placeholder"),
            notes: tBookingDialog("confirm.form.notes"),
            notesPlaceholder: tBookingDialog("confirm.form.notes_placeholder"),
          },
          validation: {
            nameTooShort: tBookingDialog("confirm.validation.name_too_short"),
            nameTooLong: tBookingDialog("confirm.validation.name_too_long"),
            phoneTooShort: tBookingDialog("confirm.validation.phone_too_short"),
            phoneTooLong: tBookingDialog("confirm.validation.phone_too_long"),
            phoneInvalidFormat: tBookingDialog(
              "confirm.validation.phone_invalid_format",
            ),
            emailInvalid: tBookingDialog("confirm.validation.email_invalid"),
            notesTooLong: tBookingDialog("confirm.validation.notes_too_long"),
          },
          visitPreferences: {
            title: tBookingDialog("confirm.visit_preferences.title"),
            subtitle: tBookingDialog("confirm.visit_preferences.subtitle"),
            communicationLabel: tBookingDialog(
              "confirm.visit_preferences.communication_label",
            ),
            communicationQuiet: tBookingDialog(
              "confirm.visit_preferences.communication_quiet",
            ),
            communicationFriendly: tBookingDialog(
              "confirm.visit_preferences.communication_friendly",
            ),
            communicationChatty: tBookingDialog(
              "confirm.visit_preferences.communication_chatty",
            ),
            accessibilityLabel: tBookingDialog(
              "confirm.visit_preferences.accessibility_label",
            ),
            accessibilityWheelchair: tBookingDialog(
              "confirm.visit_preferences.accessibility_wheelchair",
            ),
            accessibilityHearing: tBookingDialog(
              "confirm.visit_preferences.accessibility_hearing",
            ),
            accessibilityVision: tBookingDialog(
              "confirm.visit_preferences.accessibility_vision",
            ),
            accessibilitySensory: tBookingDialog(
              "confirm.visit_preferences.accessibility_sensory",
            ),
            allergiesLabel: tBookingDialog(
              "confirm.visit_preferences.allergies_label",
            ),
            allergiesPlaceholder: tBookingDialog(
              "confirm.visit_preferences.allergies_placeholder",
            ),
          },
          submit: tBookingDialog("confirm.submit"),
          submitting: tBookingDialog("confirm.submitting"),
          priceChangedNotice: tBookingDialog("confirm.price_changed_notice"),
        },
        success: {
          title: tBookingDialog("success.title"),
          confirmedMessage: tBookingDialog("success.confirmed_message"),
          pendingMessage: tBookingDialog("success.pending_message"),
          summary: {
            specialist: tBookingDialog("success.summary.specialist"),
            dateTime: tBookingDialog("success.summary.date_time"),
            services: tBookingDialog("success.summary.services"),
          },
          viewAppointment: tBookingDialog("success.view_appointment"),
          close: tBookingDialog("success.close"),
        },
      },
    },
  };

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
          currentUserId={profile.id}
          currentUserProfile={currentUserProfile}
          quickBookingTranslations={quickBookingTranslations}
          isFiltered={isFiltered}
        />
      </div>
    </>
  );
}
