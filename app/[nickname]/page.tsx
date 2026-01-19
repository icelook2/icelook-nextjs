import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageProfile } from "@/lib/queries/beauty-page-profile";
import { getActiveSpecialOffers } from "@/lib/queries/special-offers";
import {
  calculateOpenStatusFromWorkingDays,
  formatWorkingStatusMessage,
} from "@/lib/utils/open-status";
import { BookingBarWrapper } from "./_components/booking-bar-wrapper";
import { ContactSection } from "./_components/contact-section";
import { HeroWithReviews } from "./_components/hero-with-reviews";
import { ServicesSection } from "./_components/services-section";
import { SpecialOffersSection } from "./_components/special-offers-section";

interface BeautyPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function BeautyPage({ params }: BeautyPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("beauty_page");
  const tBooking = await getTranslations("booking");

  const profile = await getBeautyPageProfile(nickname);

  if (!profile) {
    notFound();
  }

  // Fetch special offers for this beauty page
  const specialOffers = await getActiveSpecialOffers(profile.info.id);

  const currentUser = await getProfile();

  // Check if current user is the owner of this beauty page
  const isOwner = currentUser?.id === profile.info.owner_id;

  // Duration labels for services
  const durationLabels = {
    min: t("duration_min"),
    hour: t("duration_hour"),
  };

  // Month names for calendar
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Weekday names for calendar (starting from Monday)
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const workingStatus =
    profile.workingDays.length > 0
      ? (() => {
          const status = calculateOpenStatusFromWorkingDays(
            profile.workingDays,
            profile.timezone,
          );
          const dayNames = t.raw("day_names") as string[];
          const statusMessage = formatWorkingStatusMessage(
            status,
            (key, params) => t(`working_status.${key}`, params),
            dayNames,
          );
          return {
            isOpen: status.isOpen,
            statusMessage,
          };
        })()
      : undefined;

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
      clearSelection: "Clear selection",
    },
    bookingDialog: {
      dialogTitle: tBooking("title"),
      cancel: tBooking("close"),
      steps: {
        date: {
          title: tBooking("step_datetime"),
          subtitle: tBooking("select_date"),
          monthNames,
          weekdayNames,
          today: "Today",
          loading: "Loading...",
          noAvailability: tBooking("no_working_day"),
          nextButton: tBooking("continue"),
        },
        time: {
          title: tBooking("step_datetime"),
          subtitle: tBooking("select_time"),
          loading: "Loading...",
          noSlots: tBooking("no_available_slots"),
          morning: "Morning",
          afternoon: "Afternoon",
          evening: "Evening",
          nextButton: tBooking("continue"),
        },
        confirm: {
          title: tBooking("step_confirmation"),
          subtitle: tBooking("booking_summary"),
          summary: {
            who: "Who",
            when: "When",
            where: "Where",
            what: "What",
            price: tBooking("price"),
            duration: tBooking("duration"),
          },
          form: {
            name: tBooking("guest_name"),
            namePlaceholder: tBooking("guest_name_placeholder"),
            phone: tBooking("guest_phone"),
            phonePlaceholder: tBooking("guest_phone_placeholder"),
            email: "Email",
            emailPlaceholder: "your@email.com",
            notes: tBooking("notes"),
            notesPlaceholder: tBooking("notes_placeholder"),
          },
          validation: {
            nameTooShort: "Name is too short",
            nameTooLong: "Name is too long",
            phoneTooShort: tBooking("phone_too_short"),
            phoneTooLong: tBooking("phone_too_long"),
            phoneInvalidFormat: "Invalid phone format",
            emailInvalid: "Invalid email address",
            notesTooLong: "Notes are too long",
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
          submit: tBooking("confirm_booking"),
          submitting: "Booking...",
        },
        success: {
          title: tBooking("success_title"),
          confirmedMessage: tBooking("success_message"),
          pendingMessage: tBooking("success_pending_message"),
          appointmentId: "Booking ID",
          summary: {
            specialist: "Specialist",
            dateTime: tBooking("date_time"),
            services: tBooking("services"),
          },
          viewAppointment: tBooking("view_appointments"),
          close: tBooking("done"),
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

        {/* Special Offers */}
        {specialOffers.length > 0 && (
          <SpecialOffersSection
            offers={specialOffers}
            currency="UAH"
            locale="uk-UA"
            translations={{
              title: t("special_offers"),
              today: t("today"),
              tomorrow: t("tomorrow"),
              bookNow: t("book_now"),
            }}
          />
        )}

        {/* Services with selection */}
        <ServicesSection
          serviceGroups={profile.serviceGroups}
          title={t("services")}
          emptyMessage={t("no_services_description")}
          currency="UAH"
          locale="uk-UA"
          durationLabels={durationLabels}
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
