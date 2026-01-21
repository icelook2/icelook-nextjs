import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getClientAppointmentById } from "@/lib/queries/appointments";
import { PageHeader } from "@/lib/ui/page-header";
import {
  ClientAppointmentDetailsView,
  ClientAppointmentStatusLabel,
} from "./_components";

interface AppointmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AppointmentDetailPage({
  params,
}: AppointmentDetailPageProps) {
  const { id: appointmentId } = await params;

  const t = await getTranslations("appointments");
  const tBeautyPage = await getTranslations("beauty_page");
  const tBookingDialog = await getTranslations("beauty_page.booking");
  const profile = await getProfile();

  if (!profile) {
    redirect("/auth");
  }

  const appointment = await getClientAppointmentById(profile.id, appointmentId);

  if (!appointment) {
    notFound();
  }

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

  // Build quick booking translations (same structure as appointments list page)
  const quickBookingTranslations = {
    serviceUnavailable: t("service_unavailable"),
    fetchError: t("fetch_error"),
    loading: t("loading_service"),
    priceChanged: t("price_changed"),
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

  // Format time and price for subtitle
  const appointmentTime = appointment.start_time.slice(0, 5);
  const formattedPrice = `${(appointment.service_price_cents / 100).toFixed(0)} ${appointment.service_currency}`;

  return (
    <>
      <PageHeader
        title={appointment.service_name}
        subtitle={
          <span className="flex items-center gap-1.5 text-sm">
            <span className="text-muted">{appointmentTime}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{formattedPrice}</span>
            <span className="text-muted">·</span>
            <ClientAppointmentStatusLabel status={appointment.status} />
          </span>
        }
        backHref="/appointments"
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <ClientAppointmentDetailsView
          appointment={appointment}
          currentUserId={profile.id}
          currentUserProfile={currentUserProfile}
          quickBookingTranslations={quickBookingTranslations}
        />
      </div>
    </>
  );
}
