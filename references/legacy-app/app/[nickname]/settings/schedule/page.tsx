import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/lib/ui/page-header";
import { YearCalendar } from "./_components/year-calendar";

interface SchedulePageProps {
  params: Promise<{ nickname: string }>;
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { nickname } = await params;
  const t = await getTranslations("schedule_settings");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch all working days for history and future viewing
  const supabase = await createClient();

  const { data: workingDays } = await supabase
    .from("working_days")
    .select("date")
    .eq("beauty_page_id", beautyPage.id);

  const workingDatesSet = new Set(workingDays?.map((wd) => wd.date) ?? []);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <YearCalendar workingDates={workingDatesSet} />
      </div>
    </>
  );
}
