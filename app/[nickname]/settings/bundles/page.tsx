import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { getAllBundles } from "@/lib/queries/bundles";
import { getServiceGroupsWithServices } from "@/lib/queries/services";
import { PageHeader } from "@/lib/ui/page-header";
import { BundlesList } from "./_components/bundles-list";

interface BundlesSettingsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function BundlesSettingsPage({
  params,
}: BundlesSettingsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("bundles_settings");

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

  // Fetch bundles and services in parallel
  const [bundles, serviceGroups] = await Promise.all([
    getAllBundles(beautyPage.id),
    getServiceGroupsWithServices(beautyPage.id),
  ]);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <BundlesList
          beautyPageId={beautyPage.id}
          nickname={nickname}
          bundles={bundles}
          serviceGroups={serviceGroups}
          currency="UAH"
          locale="uk"
          translations={{
            title: t("title"),
            addBundle: t("add_bundle"),
            emptyTitle: t("empty_title"),
            emptyDescription: t("empty_description"),
            deleteConfirmTitle: t("delete_confirm_title"),
            deleteConfirmDescription: t("delete_confirm_description"),
            deleteConfirmButton: t("delete_confirm_button"),
            cancel: t("cancel"),
            bundleName: t("bundle_name"),
            bundleNamePlaceholder: t("bundle_name_placeholder"),
            description: t("description"),
            descriptionPlaceholder: t("description_placeholder"),
            selectServices: t("select_services"),
            selectServicesHint: t("select_services_hint"),
            discount: t("discount"),
            discountType: t("discount_type"),
            discountPercentage: t("discount_percentage"),
            discountFixed: t("discount_fixed"),
            preview: t("preview"),
            originalPrice: t("original_price"),
            bundlePrice: t("bundle_price"),
            totalDuration: t("total_duration"),
            services: t("services"),
            active: t("active"),
            inactive: t("inactive"),
            activate: t("activate"),
            deactivate: t("deactivate"),
            save: t("save"),
            create: t("create"),
            hiddenServicesTitle: t("hidden_services_title"),
            hiddenServicesDescription: t("hidden_services_description"),
            hiddenServicesLabel: t("hidden_services_label"),
            hiddenServicesHint: t("hidden_services_hint"),
            close: t("close"),
            // Optional limits
            optionalLimits: t("optional_limits"),
            timeLimitLabel: t("time_limit_label"),
            timeLimitHint: t("time_limit_hint"),
            validFrom: t("valid_from"),
            validUntil: t("valid_until"),
            quantityLimitLabel: t("quantity_limit_label"),
            quantityLimitHint: t("quantity_limit_hint"),
            maxQuantity: t("max_quantity"),
            unlimited: t("unlimited"),
            // Availability badges
            daysRemaining: t("days_remaining"),
            quantityRemaining: t("quantity_remaining"),
            expired: t("expired"),
            soldOut: t("sold_out"),
          }}
        />
      </div>
    </>
  );
}
