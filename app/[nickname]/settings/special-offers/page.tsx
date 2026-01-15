import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { getAllSpecialOffers } from "@/lib/queries/special-offers";
import { PageHeader } from "@/lib/ui/page-header";
import { SpecialOffersList } from "./_components/special-offers-list";

interface SpecialOffersSettingsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function SpecialOffersSettingsPage({
  params,
}: SpecialOffersSettingsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("special_offers_settings");

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

  // Fetch special offers and services in parallel
  const [specialOffers, serviceGroups] = await Promise.all([
    getAllSpecialOffers(beautyPage.id),
    getServiceGroupsWithServices(beautyPage.id),
  ]);

  // Transform special offers for the list component
  const offers = specialOffers.map((offer) => ({
    id: offer.id,
    date: offer.date,
    startTime: offer.start_time,
    endTime: offer.end_time,
    discountPercentage: offer.discount_percentage,
    originalPriceCents: offer.original_price_cents,
    discountedPriceCents: offer.discounted_price_cents,
    status: offer.status,
    service: {
      id: offer.service.id,
      name: offer.service.name,
      durationMinutes: offer.service.duration_minutes,
    },
  }));

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <SpecialOffersList
          beautyPageId={beautyPage.id}
          nickname={nickname}
          offers={offers}
          serviceGroups={serviceGroups}
          translations={{
            addOffer: t("add_offer"),
            emptyTitle: t("empty_title"),
            emptyDescription: t("empty_description"),
            deleteConfirmTitle: t("delete_confirm_title"),
            deleteConfirmDescription: t("delete_confirm_description"),
            deleteConfirmButton: t("delete_confirm_button"),
            cancel: t("cancel"),
            statusActive: t("status_active"),
            statusBooked: t("status_booked"),
            statusExpired: t("status_expired"),
            discountLabel: t("discount_label"),
          }}
        />
      </main>
    </>
  );
}
