import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import {
  getAppointmentById,
  getClientHistoryForAppointment,
} from "@/lib/queries/appointments";
import { encodeClientKey, getClientNotes } from "@/lib/queries/clients";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { PageHeader } from "@/lib/ui/page-header";
import { AppointmentDetailsView, AppointmentStatusLabel } from "./_components";

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

  // Check if appointment can be modified (for fetching service groups)
  const canModifyServices =
    appointment.status === "pending" || appointment.status === "confirmed";

  // Fetch client history, creator notes, and service groups in parallel
  const [clientHistory, creatorNotes, serviceGroups] = await Promise.all([
    getClientHistoryForAppointment(
      beautyPage.id,
      appointment.client_id,
      appointment.client_phone,
    ),
    getClientNotes(
      beautyPage.id,
      appointment.client_id,
      appointment.client_phone,
    ),
    // Only fetch service groups if appointment can be modified
    canModifyServices ? getServiceGroupsWithServices(beautyPage.id) : [],
  ]);

  // Encode client key for linking to client page (server-side only)
  const clientKey = encodeClientKey(
    appointment.client_id,
    appointment.client_phone,
  );

  // Format time and price for subtitle
  const appointmentTime = appointment.start_time.slice(0, 5);
  const totalPriceCents = appointment.appointment_services.reduce(
    (sum, s) => sum + s.price_cents,
    0,
  );
  const formattedPrice = `${(totalPriceCents / 100).toFixed(0)} ${appointment.service_currency}`;

  return (
    <>
      <PageHeader
        title={appointment.client_name}
        subtitle={
          <span className="flex items-center gap-1.5 text-sm">
            <span className="text-muted">{appointmentTime}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{formattedPrice}</span>
            <span className="text-muted">·</span>
            <AppointmentStatusLabel status={appointment.status} />
          </span>
        }
        backHref={`/${nickname}/appointments`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <AppointmentDetailsView
          appointment={appointment}
          clientHistory={clientHistory}
          clientKey={clientKey}
          nickname={nickname}
          beautyPageId={beautyPage.id}
          creatorNotes={creatorNotes}
          serviceGroups={serviceGroups}
        />
      </main>
    </>
  );
}
