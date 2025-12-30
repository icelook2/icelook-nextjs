import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageProfile } from "@/lib/queries/beauty-page-profile";
import { Button } from "@/lib/ui/button";
import { PageHeader } from "@/lib/ui/page-header";
import { calculateOpenStatus } from "@/lib/utils/open-status";
import { BookingLayoutSection } from "./_components/booking-layout-section";
import { ContactSection } from "./_components/contact-section";
import { HeroSection } from "./_components/hero-section";
import { HoursSection } from "./_components/hours-section";

interface BeautyPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function BeautyPage({ params }: BeautyPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("beauty_page");

  const profile = await getBeautyPageProfile(nickname);

  if (!profile) {
    notFound();
  }

  const currentUser = await getProfile();
  const isOwner = currentUser?.id === profile.info.owner_id;

  const openStatus = calculateOpenStatus(
    profile.businessHours,
    profile.timezone,
  );

  // Day names for hours section
  const dayNames = t.raw("day_names") as string[];

  // Duration labels for services
  const durationLabels = {
    min: t("duration_min"),
    hour: t("duration_hour"),
  };

  return (
    <>
      <PageHeader
        title={profile.info.name}
        subtitle={`@${profile.info.slug}`}
        backHref="/"
        containerClassName="px-4 lg:px-6 xl:px-8"
      >
        {isOwner && (
          <Link href={`/${profile.info.slug}/settings`}>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
              {t("settings")}
            </Button>
          </Link>
        )}
      </PageHeader>

      <HeroSection
        info={profile.info}
        openStatus={openStatus}
        translations={{
          openNow: t("open_now"),
          closed: t("closed"),
          closesAt: t.raw("closes_at"),
          opensAt: t.raw("opens_at"),
          verified: {
            title: t("verified.title"),
            description: t("verified.description"),
          },
        }}
      />

      <main className="space-y-6 px-4 pb-8 lg:px-6 xl:px-8">
        {/* Booking layout - Desktop: 4-column grid, Mobile: Tab-based */}
        <BookingLayoutSection
          serviceGroups={profile.serviceGroups}
          specialists={profile.specialists}
          beautyPageId={profile.info.id}
          nickname={profile.info.slug}
          timezone={profile.timezone}
          currency="UAH"
          locale="uk-UA"
          durationLabels={durationLabels}
          layoutTranslations={{
            services: {
              title: t("services"),
            },
            specialists: {
              title: t("specialists"),
              fallbackName: t("specialist_fallback"),
            },
            dateTime: {
              title: t("booking_layout.date_time"),
              selectSpecialistFirst: t("booking_layout.select_specialist_first"),
              selectSpecialistForTime: t("booking_layout.select_specialist_for_time"),
              calendar: {
                monthNames: t.raw("booking.date.month_names") as string[],
                weekdayNames: t.raw("booking.date.weekday_names") as string[],
                today: t("booking.date.today"),
                noAvailability: t("booking.date.no_availability"),
              },
              time: {
                morning: t("booking.time.morning"),
                afternoon: t("booking.time.afternoon"),
                evening: t("booking.time.evening"),
                noSlots: t("booking.time.no_slots"),
              },
            },
            confirmation: {
              title: t("booking_layout.confirmation.title"),
              services: t("booking_layout.confirmation.services"),
              specialist: t("booking_layout.confirmation.specialist"),
              dateTime: t("booking_layout.confirmation.date_time"),
              total: t("booking_layout.confirmation.total"),
              bookButton: t("booking_layout.confirmation.book_button"),
              selectServices: t("booking_layout.confirmation.select_services"),
              selectSpecialist: t("booking_layout.confirmation.select_specialist"),
              selectDateTime: t("booking_layout.confirmation.select_date_time"),
            },
            form: {
              name: t("booking.confirm.form.name"),
              namePlaceholder: t("booking.confirm.form.name_placeholder"),
              phone: t("booking.confirm.form.phone"),
              phonePlaceholder: t("booking.confirm.form.phone_placeholder"),
              email: t("booking.confirm.form.email"),
              emailPlaceholder: t("booking.confirm.form.email_placeholder"),
              notes: t("booking.confirm.form.notes"),
              notesPlaceholder: t("booking.confirm.form.notes_placeholder"),
            },
            validation: {
              nameTooShort: t("booking.confirm.validation.name_too_short"),
              nameTooLong: t("booking.confirm.validation.name_too_long"),
              phoneTooShort: t("booking.confirm.validation.phone_too_short"),
              phoneTooLong: t("booking.confirm.validation.phone_too_long"),
              phoneInvalidFormat: t("booking.confirm.validation.phone_invalid_format"),
              emailInvalid: t("booking.confirm.validation.email_invalid"),
              notesTooLong: t("booking.confirm.validation.notes_too_long"),
            },
            success: {
              title: t("booking.success.title"),
              confirmedMessage: t("booking.success.confirmed_message"),
              pendingMessage: t("booking.success.pending_message"),
            },
            tabs: {
              services: t("booking_layout.tabs.services"),
              specialists: t("booking_layout.tabs.specialists"),
              dateTime: t("booking_layout.tabs.date_time"),
              book: t("booking_layout.tabs.book"),
            },
          }}
          currentUserId={currentUser?.id}
          currentUserProfile={
            currentUser?.full_name
              ? { name: currentUser.full_name, email: currentUser.email }
              : undefined
          }
        />

        <HoursSection
          businessHours={profile.businessHours}
          timezone={profile.timezone}
          translations={{
            title: t("hours"),
            today: t("today"),
            closed: t("closed"),
            seeFullSchedule: t("see_full_schedule"),
            dayNames,
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
      </main>
    </>
  );
}
