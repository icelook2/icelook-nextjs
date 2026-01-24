import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getClientDetails } from "@/lib/queries";
import { isClientBlocked } from "@/lib/queries/clients";
import { PageHeader } from "@/lib/ui/page-header";
import {
  AppointmentHistory,
  BlockClientSection,
  ClientContacts,
  ClientProfile,
  ClientStats,
  CreatorNotesSection,
  ServicesBreakdown,
} from "../clients/[clientId]/_components";

interface ClientDetailContentProps {
  nickname: string;
  clientId: string;
  backHref: string;
  /** Base path for sub-page links (e.g., /nickname/settings/clients/clientId) */
  basePath: string;
}

/**
 * Shared content component for client details page.
 * Used by both /clients/[clientId] and /blocked-clients/[clientId] routes.
 */
export async function ClientDetailContent({
  nickname,
  clientId,
  backHref,
  basePath,
}: ClientDetailContentProps) {
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

  // Fetch client details and block status in parallel
  const [details, blocked] = await Promise.all([
    getClientDetails(beautyPage.id, clientId),
    isClientBlocked(beautyPage.id, clientId),
  ]);

  if (!details) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={details.client.clientName}
        subtitle={t("subtitle")}
        backHref={backHref}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Client Profile - Avatar + Name */}
          <ClientProfile client={details.client} />

          {/* Client Contacts - Email */}
          <ClientContacts client={details.client} />

          {/* Block/Unblock Client Section - shows status if blocked */}
          <BlockClientSection
            beautyPageId={beautyPage.id}
            clientId={clientId}
            clientName={details.client.clientName}
            isBlocked={blocked}
            blockedAt={details.client.blockedAt}
            blockedUntil={details.client.blockedUntil}
            noShowCount={details.client.noShowCount}
          />

          {/* Creator Notes - Private notes about client */}
          <CreatorNotesSection
            beautyPageId={beautyPage.id}
            nickname={nickname}
            clientId={clientId}
            initialNotes={details.client.creatorNotes}
          />

          {/* Appointment History */}
          <AppointmentHistory
            appointments={details.appointments}
            nickname={nickname}
            clientId={clientId}
            basePath={basePath}
          />

          {/* Services Breakdown */}
          <ServicesBreakdown
            details={details}
            nickname={nickname}
            clientId={clientId}
            basePath={basePath}
          />

          {/* Stats Grid - at the end for quick reference */}
          <ClientStats details={details} />
        </div>
      </div>
    </>
  );
}
