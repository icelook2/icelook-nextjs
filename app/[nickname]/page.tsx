import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageProfile } from "@/lib/queries/beauty-page-profile";
import { getActiveBundles } from "@/lib/queries/bundles";
import { getActivePromotions } from "@/lib/queries/promotions";
import { getWorkingStatus } from "@/lib/utils/open-status";
import { BookingBarWrapper } from "./_components/booking-bar-wrapper";
import { ContactSection } from "./_components/contact-section";
import { HeroWithReviews } from "./_components/hero-with-reviews";
import { ServicesSection } from "./_components/services-section";

interface BeautyPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function BeautyPage({ params }: BeautyPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("beauty_page");
  const tBooking = await getTranslations("booking");
  const tBookingDialog = await getTranslations("beauty_page.booking");

  const profile = await getBeautyPageProfile(nickname);

  if (!profile) {
    notFound();
  }

  // Fetch promotions and bundles for this beauty page
  const [promotions, bundles] = await Promise.all([
    getActivePromotions(profile.info.id),
    getActiveBundles(profile.info.id),
  ]);

  const currentUser = await getProfile();

  // Check if current user is the owner of this beauty page
  const isOwner = currentUser?.id === profile.info.owner_id;

  // Duration labels for services
  const durationLabels = {
    min: t("duration_min"),
    hour: t("duration_hour"),
  };

  // Month names and weekday names from translations
  const monthNames = tBookingDialog.raw("date.month_names") as string[];
  const weekdayNames = tBookingDialog.raw("date.weekday_names") as string[];

  // Beauty page info for booking
  const beautyPageInfo = {
    name: profile.info.name,
    avatarUrl: profile.info.logo_url,
    address: profile.info.address,
  };

  // Creator info for booking
  const creatorInfo = {
    displayName: profile.info.creator_display_name ?? profile.info.name,
    avatarUrl: profile.info.creator_avatar_url ?? profile.info.logo_url,
  };

  // Working status (only if working days are scheduled)
  const dayNames = t.raw("day_names") as string[];
  const workingStatus = getWorkingStatus(
    profile.workingDays,
    profile.timezone,
    (key, params) => t(`working_status.${key}`, params),
    dayNames,
  );

  // Current user profile for booking
  const currentUserProfile = currentUser
    ? {
        name: currentUser.full_name ?? "",
        email: currentUser.email ?? null,
      }
    : undefined;

  // Booking translations
  const bookingTranslations = {
    bookingBar: {
      serviceSelected: tBooking("services_count", { count: 1 }),
      servicesSelected: tBooking("services_count", { count: 2 }).replace(
        "2",
        "{count}",
      ),
      bookNow: tBooking("book_now"),
      clearSelection: t("selection.clear_selection"),
    },
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

  return (
    <BookingBarWrapper
      beautyPageId={profile.info.id}
      nickname={nickname}
      timezone={profile.timezone}
      currency="UAH"
      locale="uk-UA"
      serviceGroups={profile.serviceGroups}
      currentUserId={currentUser?.id}
      currentUserProfile={currentUserProfile}
      beautyPageInfo={beautyPageInfo}
      creatorInfo={creatorInfo}
      durationLabels={durationLabels}
      translations={bookingTranslations}
    >
      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-24">
        <HeroWithReviews
          info={profile.info}
          ratingStats={profile.ratingStats}
          workingStatus={workingStatus}
          isOwner={isOwner}
          translations={{
            verified: {
              title: t("verified.title"),
              description: t("verified.description"),
            },
            reviews: t("reviews"),
            reviewsDialog: {
              title: t("reviews_title", { name: profile.info.name }),
              basedOnReviews: t("reviews_based_on", {
                count: profile.ratingStats.totalReviews,
              }),
              noReviewsYet: t("no_reviews_yet"),
              anonymous: t("anonymous"),
            },
          }}
        />

        <ServicesSection
          serviceGroups={profile.serviceGroups}
          bundles={bundles}
          promotions={promotions}
          title={t("services")}
          emptyMessage={t("no_services_description")}
          currency="UAH"
          locale="uk-UA"
          durationLabels={durationLabels}
          translations={{
            dealsTitle: t("special_offers"),
          }}
        />

        <ContactSection
          contact={profile.info}
          translations={{
            title: t("contact"),
            viewOnMap: t("view_on_map"),
            visitInstagram: t("visit_instagram"),
          }}
        />
      </div>
    </BookingBarWrapper>
  );
}
