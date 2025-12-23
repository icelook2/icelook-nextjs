import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import {
  getBeautyPageAdmins,
  getBeautyPageByNickname,
  getBusinessHours,
  getDefaultBusinessHours,
  getSpecialHours,
} from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import {
  BusinessHoursForm,
  SpecialHoursSection,
  TimezoneSelector,
} from "./_components";

interface BusinessHoursPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function BusinessHoursPage({
  params,
}: BusinessHoursPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("business_hours");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Check if user is owner or admin
  const isOwner = profile.id === beautyPage.owner_id;
  const admins = await getBeautyPageAdmins(beautyPage.id);
  const userIsAdmin = admins.some((a) => a.user_id === profile.id);

  if (!isOwner && !userIsAdmin) {
    redirect(`/${nickname}`);
  }

  // Fetch existing business hours
  const existingHours = await getBusinessHours(beautyPage.id);
  const specialHours = await getSpecialHours(beautyPage.id);

  // Merge existing hours with defaults for any missing days
  const defaults = getDefaultBusinessHours();
  const hours = defaults.map((defaultDay) => {
    const existing = existingHours.find(
      (h) => h.day_of_week === defaultDay.dayOfWeek,
    );
    if (existing) {
      return {
        dayOfWeek: existing.day_of_week,
        isOpen: existing.is_open,
        openTime: existing.open_time.slice(0, 5), // Remove seconds
        closeTime: existing.close_time.slice(0, 5),
      };
    }
    return defaultDay;
  });

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Timezone */}
          <SettingsGroup
            title={t("timezone.title")}
            description={t("timezone.description")}
          >
            <TimezoneSelector
              beautyPageId={beautyPage.id}
              nickname={nickname}
              currentTimezone={beautyPage.timezone ?? "UTC"}
            />
          </SettingsGroup>

          {/* Regular Business Hours */}
          <BusinessHoursForm
            beautyPageId={beautyPage.id}
            nickname={nickname}
            initialHours={hours}
          />

          {/* Special Hours / Holidays */}
          <SpecialHoursSection
            beautyPageId={beautyPage.id}
            nickname={nickname}
            specialHours={specialHours}
          />
        </div>
      </main>
    </>
  );
}
