import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { getAllResources } from "@/lib/queries/resources";
import { PageHeader } from "@/lib/ui/page-header";
import { ResourcesList } from "./_components/resources-list";

interface ResourcesSettingsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function ResourcesSettingsPage({
  params,
}: ResourcesSettingsPageProps) {
  const { nickname } = await params;
  const t = await getTranslations("resources_settings");

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

  // Fetch resources
  const resources = await getAllResources(beautyPage.id);

  return (
    <>
      <PageHeader
        title={t("page_title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}/settings`}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
        <ResourcesList
          beautyPageId={beautyPage.id}
          nickname={nickname}
          resources={resources}
          currency="UAH"
          locale="uk"
          translations={{
            title: t("title"),
            addResource: t("add_resource"),
            emptyTitle: t("empty_title"),
            emptyDescription: t("empty_description"),
            deleteConfirmTitle: t("delete_confirm_title"),
            deleteConfirmDescription: t("delete_confirm_description"),
            deleteConfirmButton: t("delete_confirm_button"),
            cancel: t("cancel"),
            resourceName: t("resource_name"),
            resourceNamePlaceholder: t("resource_name_placeholder"),
            unit: t("unit"),
            unitPlaceholder: t("unit_placeholder"),
            costPerUnit: t("cost_per_unit"),
            currentStock: t("current_stock"),
            lowStockThreshold: t("low_stock_threshold"),
            lowStockThresholdHint: t("low_stock_threshold_hint"),
            inStock: t("in_stock"),
            lowStock: t("low_stock"),
            outOfStock: t("out_of_stock"),
            active: t("active"),
            inactive: t("inactive"),
            activate: t("activate"),
            deactivate: t("deactivate"),
            adjustStock: t("adjust_stock"),
            adjustStockAdd: t("adjust_stock_add"),
            adjustStockRemove: t("adjust_stock_remove"),
            adjustment: t("adjustment"),
            save: t("save"),
            create: t("create"),
            edit: t("edit"),
            delete: t("delete"),
            totalValue: t("total_value"),
            linkedServices: t("linked_services"),
          }}
        />
      </div>
    </>
  );
}
