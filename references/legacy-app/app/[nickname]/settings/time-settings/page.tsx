import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SlotIntervalForm, TimezoneForm } from "../_components";

interface TimeSettingsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function TimeSettingsPage({
  params,
}: TimeSettingsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("time_settings");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <TimezoneForm
          beautyPageId={beautyPage.id}
          nickname={nickname}
          currentTimezone={beautyPage.timezone}
        />

        <SlotIntervalForm
          beautyPageId={beautyPage.id}
          nickname={nickname}
          currentSlotInterval={beautyPage.slot_interval_minutes ?? 30}
        />
      </div>
    </>
  );
}
