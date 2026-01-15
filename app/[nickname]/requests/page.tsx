import { addDays } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { toDateString } from "../appointments/_lib/date-utils";
import { getScheduleData } from "../appointments/_lib/queries";
import { RequestsView } from "./requests-view";

interface RequestsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function RequestsPage({ params }: RequestsPageProps) {
  const { nickname } = await params;

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access requests view
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch appointments for the next 60 days to get all pending requests
  const today = new Date();
  const startDate = toDateString(today);
  const endDate = toDateString(addDays(today, 60));

  const { appointments } = await getScheduleData(
    beautyPage.id,
    startDate,
    endDate,
  );

  // Filter to pending appointments only
  const pendingAppointments = appointments.filter(
    (apt) => apt.status === "pending",
  );

  return (
    <>
      <PageHeader
        title="Requests"
        subtitle={beautyPage.name}
        backHref={`/${nickname}/appointments`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <RequestsView
          beautyPageId={beautyPage.id}
          nickname={nickname}
          appointments={pendingAppointments}
        />
      </main>
    </>
  );
}
