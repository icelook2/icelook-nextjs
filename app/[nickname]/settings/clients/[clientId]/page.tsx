import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getClientDetails } from "@/lib/queries";
import { decodeClientKey } from "@/lib/queries/clients";
import { PageHeader } from "@/lib/ui/page-header";
import {
  AppointmentHistory,
  ClientContacts,
  ClientProfile,
  ClientStats,
  CreatorNotesSection,
  ServicesBreakdown,
} from "./_components";

interface ClientDetailPageProps {
  params: Promise<{ nickname: string; clientId: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { nickname, clientId } = await params;
  const t = await getTranslations("clients.detail");

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

  // Decode and validate client key
  let decodedKey: { clientId: string | null; clientPhone: string | null };
  try {
    decodedKey = decodeClientKey(clientId);
  } catch {
    notFound();
  }

  // Fetch client details
  const details = await getClientDetails(beautyPage.id, clientId);

  if (!details) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={details.client.clientName}
        subtitle={t("subtitle")}
        backHref={`/${nickname}/settings/clients`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Client Profile - Avatar + Name */}
          <ClientProfile client={details.client} />

          {/* Client Contacts - Phone + Email */}
          <ClientContacts client={details.client} />

          {/* Creator Notes - Private notes about client */}
          <CreatorNotesSection
            beautyPageId={beautyPage.id}
            nickname={nickname}
            clientId={decodedKey.clientId}
            clientPhone={details.client.clientPhone}
            initialNotes={details.client.creatorNotes}
          />

          {/* Appointment History */}
          <AppointmentHistory
            appointments={details.appointments}
            nickname={nickname}
            clientId={clientId}
          />

          {/* Services Breakdown */}
          <ServicesBreakdown
            details={details}
            nickname={nickname}
            clientId={clientId}
          />

          {/* Stats Grid - at the end for quick reference */}
          <ClientStats details={details} />
        </div>
      </div>
    </>
  );
}
