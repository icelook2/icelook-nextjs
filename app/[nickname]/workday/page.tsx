import { addDays, isValid, parseISO } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { WorkdayView } from "./_components";
import { getScheduleData } from "../settings/schedule/_lib/queries";
import { toDateString } from "../settings/schedule/_lib/date-utils";

interface WorkdayPageProps {
  params: Promise<{ nickname: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function WorkdayPage({
  params,
  searchParams,
}: WorkdayPageProps) {
  const { nickname } = await params;
  const { date: dateParam } = await searchParams;

  // Parse date from URL or use today
  let selectedDate = new Date();
  if (dateParam) {
    const parsed = parseISO(dateParam);
    if (isValid(parsed)) {
      selectedDate = parsed;
    }
  }

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access workday view
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch schedule data for selected date + 30 days (for requests tab)
  const startDate = toDateString(selectedDate);
  const endDate = toDateString(addDays(selectedDate, 30));

  const { appointments } = await getScheduleData(
    beautyPage.id,
    startDate,
    endDate,
  );

  return (
    <>
      <PageHeader
        title="Workday"
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <WorkdayView
          beautyPageId={beautyPage.id}
          nickname={nickname}
          appointments={appointments}
          selectedDate={selectedDate}
        />
      </main>
    </>
  );
}
