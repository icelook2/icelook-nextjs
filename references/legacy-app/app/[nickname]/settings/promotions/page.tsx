import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { getAllPromotions } from "@/lib/queries/promotions";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { PageHeader } from "@/lib/ui/page-header";
import { PromotionsList } from "./_components/promotions-list";

interface PromotionsSettingsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function PromotionsSettingsPage({
  params,
}: PromotionsSettingsPageProps) {
  const { nickname } = await params;
  const [t, locale] = await Promise.all([
    getTranslations("promotions_settings"),
    getLocale(),
  ]);

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

  // Fetch promotions and services in parallel
  const [promotions, serviceGroups] = await Promise.all([
    getAllPromotions(beautyPage.id),
    getServiceGroupsWithServices(beautyPage.id),
  ]);

  // Transform promotions for the list component
  const items = promotions.map((promo) => ({
    id: promo.id,
    type: promo.type,
    discountPercentage: promo.discount_percentage,
    originalPriceCents: promo.original_price_cents,
    discountedPriceCents: promo.discounted_price_cents,
    status: promo.status,
    // Sale fields
    startsAt: promo.starts_at,
    endsAt: promo.ends_at,
    // Slot fields
    slotDate: promo.slot_date,
    slotStartTime: promo.slot_start_time,
    slotEndTime: promo.slot_end_time,
    // Time fields
    recurringStartTime: promo.recurring_start_time,
    recurringDays: promo.recurring_days,
    recurringValidUntil: promo.recurring_valid_until,
    service: {
      id: promo.service.id,
      name: promo.service.name,
      durationMinutes: promo.service.duration_minutes,
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

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <PromotionsList
          beautyPageId={beautyPage.id}
          nickname={nickname}
          promotions={items}
          serviceGroups={serviceGroups}
          translations={{
            addPromotion: t("add_promotion"),
            emptyTitle: t("empty_title"),
            emptyDescription: t("empty_description"),
            deleteConfirmTitle: t("delete_confirm_title"),
            deleteConfirmDescription: t("delete_confirm_description"),
            deleteConfirmButton: t("delete_confirm_button"),
            cancel: t("cancel"),
            statusActive: t("status_active"),
            statusBooked: t("status_booked"),
            statusExpired: t("status_expired"),
            statusInactive: t("status_inactive"),
            discountLabel: t("discount_label"),
            typeSale: t("type_sale"),
            typeSlot: t("type_slot"),
            typeTime: t("type_time"),
            untilDate: t("until_date"),
            everyDay: t("every_day"),
            weekdays: t("weekdays"),
            // Create dialog translations
            selectService: t("select_service"),
            selectServiceHint: t("select_service_hint"),
            promotionType: t("promotion_type"),
            typeSaleDescription: t("type_sale_description"),
            typeSlotDescription: t("type_slot_description"),
            typeTimeDescription: t("type_time_description"),
            discount: t("discount"),
            endDate: t("end_date"),
            slotDate: t("slot_date"),
            slotTime: t("slot_time"),
            recurringTime: t("recurring_time"),
            recurringDays: t("recurring_days"),
            recurringDaysHint: t("recurring_days_hint"),
            validUntil: t("valid_until"),
            validUntilHint: t("valid_until_hint"),
            preview: t("preview"),
            originalPrice: t("original_price"),
            discountedPrice: t("discounted_price"),
            create: t("create"),
          }}
          locale={locale}
          currency="UAH"
        />
      </div>
    </>
  );
}
