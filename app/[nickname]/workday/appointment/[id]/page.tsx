import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import {
  getAppointmentById,
  getClientHistoryForAppointment,
} from "@/lib/queries/appointments";
import { encodeClientKey } from "@/lib/queries/clients";
import { PageHeader } from "@/lib/ui/page-header";
import { AppointmentDetailsView } from "./_components";

interface AppointmentDetailPageProps {
  params: Promise<{ nickname: string; id: string }>;
}

export default async function AppointmentDetailPage({
  params,
}: AppointmentDetailPageProps) {
  const { nickname, id: appointmentId } = await params;

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Solo creator model: only owner can access workday
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
    redirect(`/${nickname}`);
  }

  // Fetch appointment
  const appointment = await getAppointmentById(beautyPage.id, appointmentId);

  if (!appointment) {
    notFound();
  }

  // Fetch client history (for returning clients)
  const clientHistory = await getClientHistoryForAppointment(
    beautyPage.id,
    appointment.client_id,
    appointment.client_phone,
  );

  // Encode client key for linking to client page (server-side only)
  const clientKey = encodeClientKey(
    appointment.client_id,
    appointment.client_phone,
  );

  return (
    <>
      <PageHeader
        title="Appointment Details"
        backHref={`/${nickname}/workday`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <AppointmentDetailsView
          appointment={appointment}
          clientHistory={clientHistory}
          clientKey={clientKey}
          nickname={nickname}
          beautyPageId={beautyPage.id}
        />
      </main>
    </>
  );
}
