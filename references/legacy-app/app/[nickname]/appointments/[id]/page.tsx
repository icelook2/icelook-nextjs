import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import {
  getAppointmentById,
  getClientHistoryForAppointment,
} from "@/lib/queries/appointments";
import { getClientNotes } from "@/lib/queries/clients";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { PageHeader } from "@/lib/ui/page-header";
import { AppointmentDetailsView, AppointmentStatusLabel } from "./_components";

interface AppointmentDetailPageProps {
  params: Promise<{ nickname: string; id: string }>;
}

export default async function AppointmentDetailPage({
  params,
}: AppointmentDetailPageProps) {
  const { nickname, id: appointmentId } = await params;

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access workday
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch appointment
  const appointment = await getAppointmentById(beautyPage.id, appointmentId);

  if (!appointment) {
    notFound();
  }

  // Check if appointment can be modified (for fetching service groups)
  const canModifyServices =
    appointment.status === "pending" || appointment.status === "confirmed";

  // Fetch client history, creator notes, and service groups in parallel
  // client_id is always present since only authenticated users can book
  const [clientHistory, creatorNotes, serviceGroups] = await Promise.all([
    getClientHistoryForAppointment(beautyPage.id, appointment.client_id),
    appointment.client_id
      ? getClientNotes(beautyPage.id, appointment.client_id)
      : null,
    // Only fetch service groups if appointment can be modified
    canModifyServices ? getServiceGroupsWithServices(beautyPage.id) : [],
  ]);

  // Format time and price for subtitle
  const appointmentTime = appointment.start_time.slice(0, 5);
  const totalPriceCents = appointment.appointment_services.reduce(
    (sum, s) => sum + s.price_cents,
    0,
  );
  const formattedPrice = `${(totalPriceCents / 100).toFixed(0)} ${appointment.service_currency}`;

  // Fetch translations for reschedule dialog and action confirmations
  const tPage = await getTranslations("beauty_page");
  const tBooking = await getTranslations("beauty_page.booking");
  const tRescheduleDialog = await getTranslations(
    "appointment_details.reschedule_dialog",
  );
  const tAppointmentActions = await getTranslations(
    "specialist.settings.appointments",
  );

  // Month and weekday names for date picker
  const monthNames = tBooking.raw("date.month_names") as string[];
  const weekdayNames = tBooking.raw("date.weekday_names") as string[];

  // Build reschedule translations
  const rescheduleTranslations = {
    serviceUnavailable: tRescheduleDialog("service_unavailable"),
    fetchError: tRescheduleDialog("fetch_error"),
    loading: tRescheduleDialog("loading"),
    close: tRescheduleDialog("close"),
    durationLabels: {
      min: tPage("duration_min"),
      hour: tPage("duration_hour"),
    },
    bookingDialog: {
      dialogTitle: tBooking("reschedule_dialog_title"),
      cancel: tBooking("cancel"),
      steps: {
        date: {
          title: tBooking("date.title"),
          subtitle: tBooking("date.subtitle"),
          monthNames,
          weekdayNames,
          today: tBooking("date.today"),
          loading: tBooking("date.loading"),
          noAvailability: tBooking("date.no_availability"),
          nextButton: tBooking("date.next_button"),
        },
        time: {
          title: tBooking("time.title"),
          subtitle: tBooking("time.subtitle"),
          loading: tBooking("time.loading"),
          noSlots: tBooking("time.no_slots"),
          morning: tBooking("time.morning"),
          afternoon: tBooking("time.afternoon"),
          evening: tBooking("time.evening"),
          nextButton: tBooking("time.next_button"),
        },
        confirm: {
          title: tBooking("confirm.reschedule_title"),
          subtitle: tBooking("confirm.reschedule_subtitle"),
          summary: {
            who: tBooking("confirm.summary.who"),
            when: tBooking("confirm.summary.when"),
            where: tBooking("confirm.summary.where"),
            what: tBooking("confirm.summary.what"),
            price: tBooking("confirm.summary.price"),
            duration: tBooking("confirm.summary.duration"),
          },
          form: {
            name: tBooking("confirm.form.name"),
            namePlaceholder: tBooking("confirm.form.name_placeholder"),
            phone: tBooking("confirm.form.phone"),
            phonePlaceholder: tBooking("confirm.form.phone_placeholder"),
            email: tBooking("confirm.form.email"),
            emailPlaceholder: tBooking("confirm.form.email_placeholder"),
            notes: tBooking("confirm.form.notes"),
            notesPlaceholder: tBooking("confirm.form.notes_placeholder"),
          },
          validation: {
            nameTooShort: tBooking("confirm.validation.name_too_short"),
            nameTooLong: tBooking("confirm.validation.name_too_long"),
            phoneTooShort: tBooking("confirm.validation.phone_too_short"),
            phoneTooLong: tBooking("confirm.validation.phone_too_long"),
            phoneInvalidFormat: tBooking(
              "confirm.validation.phone_invalid_format",
            ),
            emailInvalid: tBooking("confirm.validation.email_invalid"),
            notesTooLong: tBooking("confirm.validation.notes_too_long"),
          },
          visitPreferences: {
            title: tBooking("confirm.visit_preferences.title"),
            subtitle: tBooking("confirm.visit_preferences.subtitle"),
            communicationLabel: tBooking(
              "confirm.visit_preferences.communication_label",
            ),
            communicationQuiet: tBooking(
              "confirm.visit_preferences.communication_quiet",
            ),
            communicationFriendly: tBooking(
              "confirm.visit_preferences.communication_friendly",
            ),
            communicationChatty: tBooking(
              "confirm.visit_preferences.communication_chatty",
            ),
            accessibilityLabel: tBooking(
              "confirm.visit_preferences.accessibility_label",
            ),
            accessibilityWheelchair: tBooking(
              "confirm.visit_preferences.accessibility_wheelchair",
            ),
            accessibilityHearing: tBooking(
              "confirm.visit_preferences.accessibility_hearing",
            ),
            accessibilityVision: tBooking(
              "confirm.visit_preferences.accessibility_vision",
            ),
            accessibilitySensory: tBooking(
              "confirm.visit_preferences.accessibility_sensory",
            ),
            allergiesLabel: tBooking(
              "confirm.visit_preferences.allergies_label",
            ),
            allergiesPlaceholder: tBooking(
              "confirm.visit_preferences.allergies_placeholder",
            ),
          },
          submit: tBooking("confirm.reschedule_submit"),
          submitting: tBooking("confirm.reschedule_submitting"),
          priceChangedNotice: tBooking("confirm.price_changed_notice"),
        },
        success: {
          title: tBooking("success.title"),
          confirmedMessage: tBooking("success.confirmed_message"),
          pendingMessage: tBooking("success.pending_message"),
          rescheduledTitle: tBooking("success.rescheduled_title"),
          rescheduledMessage: tBooking("success.rescheduled_message"),
          summary: {
            specialist: tBooking("success.summary.specialist"),
            dateTime: tBooking("success.summary.date_time"),
            services: tBooking("success.summary.services"),
          },
          viewAppointment: tBooking("success.view_appointment"),
          close: tBooking("success.close"),
        },
      },
    },
  };

  // Build action confirmation translations
  // Use .raw() for messages with placeholders since we do string replacement on the client
  const actionTranslations = {
    confirm: {
      title: tAppointmentActions("confirm_title"),
      message: tAppointmentActions.raw("confirm_message") as string,
      yes: tAppointmentActions("yes_confirm"),
    },
    complete: {
      title: tAppointmentActions("complete_title"),
      message: tAppointmentActions.raw("complete_message") as string,
      yes: tAppointmentActions("yes_complete"),
    },
    cancel: {
      title: tAppointmentActions("cancel_title"),
      message: tAppointmentActions.raw("cancel_message") as string,
      yes: tAppointmentActions("yes_cancel"),
    },
    no_show: {
      title: tAppointmentActions("no_show_title"),
      message: tAppointmentActions.raw("no_show_message") as string,
      yes: tAppointmentActions("yes_no_show"),
    },
    keep: tAppointmentActions("keep"),
  };

  // Fetch translations for date/time card
  const tAppointments = await getTranslations("appointments");
  const dateTimeTranslations = {
    date: tAppointments("date_time"),
    time: tAppointments("time"),
  };

  return (
    <>
      <PageHeader
        title={appointment.client_name}
        subtitle={
          <span className="flex items-center gap-1.5 text-sm">
            <span className="text-muted">{appointmentTime}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{formattedPrice}</span>
            <span className="text-muted">·</span>
            <AppointmentStatusLabel status={appointment.status} />
          </span>
        }
        backHref={`/${nickname}/appointments`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <AppointmentDetailsView
          appointment={appointment}
          clientHistory={clientHistory}
          nickname={nickname}
          beautyPageId={beautyPage.id}
          creatorNotes={creatorNotes}
          serviceGroups={serviceGroups}
          rescheduleTranslations={rescheduleTranslations}
          actionTranslations={actionTranslations}
          dateTimeTranslations={dateTimeTranslations}
        />
      </div>
    </>
  );
}
