import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { toDateString } from "../_lib/date-utils";
import { getScheduleData } from "../_lib/queries";
import { NoShowView } from "./_components/no-show-view";

interface NoShowPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function NoShowPage({ params }: NoShowPageProps) {
  const { nickname } = await params;

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch today's appointments
  const today = new Date();
  const todayStr = toDateString(today);

  const { appointments } = await getScheduleData(
    beautyPage.id,
    todayStr,
    todayStr,
  );

  return (
    <>
      <PageHeader
        title="No-show Appointments"
        subtitle="Today"
        backHref={`/${nickname}/appointments`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <NoShowView appointments={appointments} />
      </main>
    </>
  );
}
