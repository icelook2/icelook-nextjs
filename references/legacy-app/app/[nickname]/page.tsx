import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageForViewer } from "@/lib/queries/beauty-page-viewer";
import { getActiveBundles } from "@/lib/queries/bundles";
import { getActivePromotions } from "@/lib/queries/promotions";
import { getSlugRedirect } from "@/lib/queries/slug-history";
import { PageHeader } from "@/lib/ui/page-header";
import { Paper } from "@/lib/ui/paper";
import { BookingBarWrapper } from "./_components/booking-bar-wrapper";
import { ContactSection } from "./_components/contact-section";
import { EditProfileDialog } from "./_components/edit-profile-dialog";
import { HeroSection } from "./_components/hero-section";
import { ProfileTabs } from "./_components/profile-tabs";
import { ReviewsContent } from "./_components/reviews-content";
import { ServicesSection } from "./_components/services-section";

interface BeautyPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function BeautyPage({ params }: BeautyPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("beauty_page");
  const tBooking = await getTranslations("booking");
  const tBookingDialog = await getTranslations("beauty_page.booking");
  const tEditProfile = await getTranslations("beauty_page.edit_profile");

  // Get current user first (needed for ban check)
  const currentUser = await getProfile();

  // Fetch beauty page with ban check - single RPC call
  // Returns "banned" if user is blocked, "not_found" if page doesn't exist
  const result = await getBeautyPageForViewer(
    nickname,
    currentUser?.id ?? null,
  );

  // Both "banned" and "not_found" show 404 (don't reveal ban status)
  if (result.type !== "success") {
    // Check if this is an old slug that should redirect
    const slugRedirect = await getSlugRedirect(nickname);
    if (slugRedirect?.shouldRedirect) {
      // 301 permanent redirect to new slug
      redirect(`/${slugRedirect.newSlug}`);
    }
    notFound();
  }

  const profile = result.profile;

  // Check if current user is the owner of this beauty page
  const isOwner = currentUser?.id === profile.info.owner_id;

  // Fetch promotions and bundles
  const [promotions, bundles] = await Promise.all([
    getActivePromotions(profile.info.id),
    getActiveBundles(profile.info.id),
  ]);

  // Calculate slug cooldown days remaining (for edit profile dialog)
  const SLUG_COOLDOWN_DAYS = 30;
  const slugCooldownDaysRemaining = (() => {
    const slugChangedAt = profile.info.slug_changed_at;
    if (!slugChangedAt) {
      return 0;
    }
    const lastChange = new Date(slugChangedAt);
    const cooldownEnd = new Date(lastChange);
    cooldownEnd.setDate(cooldownEnd.getDate() + SLUG_COOLDOWN_DAYS);
    const now = new Date();
    if (now >= cooldownEnd) {
      return 0;
    }
    return Math.ceil(
      (cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  })();

  // Calculate counts for tabs
  const servicesCount = profile.serviceGroups.reduce(
    (total, group) => total + group.services.length,
    0,
  );
  const reviewsCount = profile.ratingStats.totalReviews;

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
    name: profile.info.name,
    displayName: profile.info.creator_display_name ?? profile.info.name,
    avatarUrl: profile.info.creator_avatar_url ?? profile.info.logo_url,
  };

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
      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24">
        <PageHeader
          title={profile.info.name}
          subtitle={`@${profile.info.slug}`}
          backHref="/"
        />

        <Paper className="p-4">
          <HeroSection
            info={profile.info}
            ratingStats={profile.ratingStats}
            isOwner={isOwner}
            translations={{
              verified: {
                title: t("verified.title"),
                description: t("verified.description"),
              },
              reviews: t("reviews"),
            }}
          />

          {/* Edit Profile button - only visible to owner */}
          {isOwner && (
            <div className="mt-4">
              <EditProfileDialog
                beautyPageId={profile.info.id}
                currentName={profile.info.name}
                currentSlug={profile.info.slug}
                currentBio={profile.info.creator_bio}
                currentAvatarUrl={profile.info.creator_avatar_url}
                slugChangedAt={profile.info.slug_changed_at}
                translations={{
                  editProfile: tEditProfile("button"),
                  title: tEditProfile("title"),
                  nameLabel: tEditProfile("name_label"),
                  namePlaceholder: tEditProfile("name_placeholder"),
                  slugLabel: tEditProfile("slug_label"),
                  slugPlaceholder: tEditProfile("slug_placeholder"),
                  slugHint: tEditProfile("slug_hint", {
                    slug: profile.info.slug,
                  }),
                  slugCooldownWarning: tEditProfile("slug_cooldown_warning", {
                    days: slugCooldownDaysRemaining,
                  }),
                  slugChangeWarning: tEditProfile("slug_change_warning"),
                  bioLabel: tEditProfile("bio_label"),
                  bioPlaceholder: tEditProfile("bio_placeholder"),
                  bioHint: tEditProfile("bio_hint"),
                  cancel: tEditProfile("cancel"),
                  save: tEditProfile("save"),
                  saving: tEditProfile("saving"),
                }}
              />
            </div>
          )}
        </Paper>

        <ProfileTabs
          servicesCount={servicesCount}
          reviewsCount={reviewsCount}
          servicesContent={
            <ServicesSection
              serviceGroups={profile.serviceGroups}
              bundles={bundles}
              promotions={promotions}
              title=""
              emptyMessage={t("no_services_description")}
              currency="UAH"
              locale="uk-UA"
              durationLabels={durationLabels}
              translations={{
                dealsTitle: t("special_offers"),
                allFilter: t("all_filter"),
                // Use t.raw() for template strings that will be interpolated manually in the component
                daysRemaining: t.raw("bundle_days_remaining"),
                quantityRemaining: t.raw("bundle_quantity_remaining"),
                includedInBundle: t("included_in_bundle"),
              }}
            />
          }
          reviewsContent={
            <ReviewsContent
              beautyPageId={profile.info.id}
              ratingStats={profile.ratingStats}
              translations={{
                basedOnReviews: t("reviews_based_on", {
                  count: profile.ratingStats.totalReviews,
                }),
                noReviewsYet: t("no_reviews_yet"),
                anonymous: t("anonymous"),
              }}
            />
          }
          contactsContent={
            <ContactSection
              contact={profile.info}
              translations={{
                title: "",
                viewOnMap: t("view_on_map"),
                visitInstagram: t("visit_instagram"),
              }}
            />
          }
          translations={{
            services: t("tabs.services"),
            reviews: t("tabs.reviews"),
            contacts: t("tabs.contacts"),
          }}
        />
      </div>
    </BookingBarWrapper>
  );
}
