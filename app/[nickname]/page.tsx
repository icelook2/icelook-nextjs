import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageProfile } from "@/lib/queries/beauty-page-profile";
import { Button } from "@/lib/ui/button";
import { PageHeader } from "@/lib/ui/page-header";
import { calculateOpenStatus } from "@/lib/utils/open-status";
import { ContactSection } from "./_components/contact-section";
import { HeroSection } from "./_components/hero-section";
import { HoursSection } from "./_components/hours-section";
import { ServicesSection } from "./_components/services-section";
import { SpecialistsSection } from "./_components/specialists-section";

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
        containerClassName="mx-auto max-w-2xl"
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

      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <ServicesSection
          serviceGroups={profile.serviceGroups}
          title={t("services")}
          emptyTitle={t("no_services_title")}
          emptyDescription={t("no_services_description")}
          durationLabels={durationLabels}
          bookingTranslations={{
            serviceSelected: t("selection.service_selected"),
            servicesSelected: t.raw("selection.services_selected"),
            selectSpecialist: t("selection.select_specialist"),
            bookNow: t("selection.book_now"),
            clearSelection: t("selection.clear_selection"),
          }}
          bookingDialogTranslations={{
            dialogTitle: t("booking.dialog_title"),
            steps: {
              specialist: {
                title: t("booking.specialist.title"),
                subtitle: t("booking.specialist.subtitle"),
              },
              date: {
                title: t("booking.date.title"),
                subtitle: t("booking.date.subtitle"),
                monthNames: t.raw("booking.date.month_names") as string[],
                weekdayNames: t.raw("booking.date.weekday_names") as string[],
                today: t("booking.date.today"),
                loading: t("booking.date.loading"),
                noAvailability: t("booking.date.no_availability"),
              },
              time: {
                title: t("booking.time.title"),
                subtitle: t("booking.time.subtitle"),
                loading: t("booking.time.loading"),
                noSlots: t("booking.time.no_slots"),
                unavailable: t("booking.time.unavailable"),
              },
              confirm: {
                title: t("booking.confirm.title"),
                subtitle: t("booking.confirm.subtitle"),
                summary: {
                  specialist: t("booking.confirm.summary.specialist"),
                  dateTime: t("booking.confirm.summary.date_time"),
                  services: t("booking.confirm.summary.services"),
                  total: t("booking.confirm.summary.total"),
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
                submit: t("booking.confirm.submit"),
                submitting: t("booking.confirm.submitting"),
              },
              success: {
                title: t("booking.success.title"),
                confirmedMessage: t("booking.success.confirmed_message"),
                pendingMessage: t("booking.success.pending_message"),
                appointmentId: t("booking.success.appointment_id"),
                summary: {
                  specialist: t("booking.success.summary.specialist"),
                  dateTime: t("booking.success.summary.date_time"),
                  services: t("booking.success.summary.services"),
                },
                done: t("booking.success.done"),
              },
            },
          }}
          beautyPageId={profile.info.id}
          nickname={profile.info.slug}
          timezone={profile.timezone}
          currentUserId={currentUser?.id}
        />

        <SpecialistsSection
          specialists={profile.specialists}
          title={t("specialists")}
          serviceCountLabel={t.raw("services_offered")}
          specialistFallback={t("specialist_fallback")}
          bookLabel={t("book")}
          reviewsTranslations={{
            reviewsLabel: t("reviews_label"),
            title: t.raw("reviews_title"),
            basedOnReviews: t.raw("reviews_based_on"),
            noReviewsYet: t("no_reviews_yet"),
            reply: t("review_reply"),
            anonymous: t("anonymous"),
          }}
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
