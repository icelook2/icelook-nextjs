"use client";

import { Package, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import type { ServiceBundleWithServices } from "@/lib/types/bundles";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { toggleBundleActive } from "../_actions/bundle.actions";
import { flattenServices } from "../_lib/bundles-constants";
import { BundleCard } from "./bundle-card";
import { CreateBundleDialog } from "./create-bundle-dialog";
import { DeleteBundleDialog } from "./delete-bundle-dialog";
import { HiddenServicesDialog } from "./hidden-services-dialog";

interface BundlesListProps {
  beautyPageId: string;
  nickname: string;
  bundles: ServiceBundleWithServices[];
  serviceGroups: ServiceGroupWithServices[];
  translations: {
    title: string;
    addBundle: string;
    emptyTitle: string;
    emptyDescription: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmButton: string;
    cancel: string;
    bundleName: string;
    bundleNamePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    selectServices: string;
    selectServicesHint: string;
    discount: string;
    discountType: string;
    discountPercentage: string;
    discountFixed: string;
    preview: string;
    originalPrice: string;
    bundlePrice: string;
    totalDuration: string;
    services: string;
    active: string;
    inactive: string;
    activate: string;
    deactivate: string;
    save: string;
    create: string;
    hiddenServicesTitle: string;
    hiddenServicesDescription: string;
    hiddenServicesLabel: string;
    hiddenServicesHint: string;
    close: string;
    // New optional limits translations
    optionalLimits: string;
    timeLimitLabel: string;
    timeLimitHint: string;
    validFrom: string;
    validUntil: string;
    quantityLimitLabel: string;
    quantityLimitHint: string;
    maxQuantity: string;
    unlimited: string;
    // Availability badges
    daysRemaining: string;
    quantityRemaining: string;
    expired: string;
    soldOut: string;
  };
  currency: string;
  locale: string;
}

export function BundlesList({
  beautyPageId,
  nickname,
  bundles,
  serviceGroups,
  translations: t,
  currency,
  locale,
}: BundlesListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hiddenServicesDialogOpen, setHiddenServicesDialogOpen] =
    useState(false);
  const [bundleToDelete, setBundleToDelete] =
    useState<ServiceBundleWithServices | null>(null);
  const [hiddenServicesData, setHiddenServicesData] = useState<{
    bundleName: string;
    services: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const services = flattenServices(serviceGroups);

  function handleDeleteClick(bundle: ServiceBundleWithServices) {
    setBundleToDelete(bundle);
    setDeleteDialogOpen(true);
  }

  function handleDeleteDialogClose(open: boolean) {
    setDeleteDialogOpen(open);
    if (!open) {
      setBundleToDelete(null);
    }
  }

  function handleHiddenServicesDialogClose(open: boolean) {
    setHiddenServicesDialogOpen(open);
    if (!open) {
      setHiddenServicesData(null);
    }
  }

  function handleToggleActive(bundle: ServiceBundleWithServices) {
    startTransition(async () => {
      const result = await toggleBundleActive({
        bundleId: bundle.id,
        beautyPageId,
        nickname,
        isActive: !bundle.is_active,
      });

      // Handle hidden services error
      if (
        !result.success &&
        result.error === "HIDDEN_SERVICES" &&
        result.data?.hiddenServices
      ) {
        setHiddenServicesData({
          bundleName: bundle.name,
          services: result.data.hiddenServices,
        });
        setHiddenServicesDialogOpen(true);
      }
    });
  }

  // Separate active and inactive bundles
  const activeBundles = bundles.filter((b) => b.is_active);
  const inactiveBundles = bundles.filter((b) => !b.is_active);

  return (
    <>
      <SettingsGroup
        title={t.title}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            disabled={services.length < 2}
          >
            <Plus className="h-4 w-4" />
            {t.addBundle}
          </Button>
        }
      >
        {bundles.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-muted" />
            <h3 className="mt-4 font-semibold">{t.emptyTitle}</h3>
            <p className="mt-2 text-sm text-muted">{t.emptyDescription}</p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => setCreateDialogOpen(true)}
                disabled={services.length < 2}
              >
                <Plus className="h-4 w-4" />
                {t.addBundle}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {activeBundles.map((bundle, index) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                variant="active"
                noBorder={
                  index === activeBundles.length - 1 &&
                  inactiveBundles.length === 0
                }
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteClick}
                isPending={isPending}
                translations={{
                  services: t.services,
                  activate: t.activate,
                  deactivate: t.deactivate,
                  inactive: t.inactive,
                  daysRemaining: t.daysRemaining,
                  quantityRemaining: t.quantityRemaining,
                  expired: t.expired,
                  soldOut: t.soldOut,
                }}
                locale={locale}
                currency={currency}
              />
            ))}

            {inactiveBundles.map((bundle, index) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                variant="inactive"
                noBorder={index === inactiveBundles.length - 1}
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteClick}
                isPending={isPending}
                translations={{
                  services: t.services,
                  activate: t.activate,
                  deactivate: t.deactivate,
                  inactive: t.inactive,
                  daysRemaining: t.daysRemaining,
                  quantityRemaining: t.quantityRemaining,
                  expired: t.expired,
                  soldOut: t.soldOut,
                }}
                locale={locale}
                currency={currency}
              />
            ))}
          </>
        )}
      </SettingsGroup>

      <CreateBundleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        beautyPageId={beautyPageId}
        nickname={nickname}
        serviceGroups={serviceGroups}
        translations={{
          addBundle: t.addBundle,
          bundleName: t.bundleName,
          bundleNamePlaceholder: t.bundleNamePlaceholder,
          description: t.description,
          descriptionPlaceholder: t.descriptionPlaceholder,
          selectServices: t.selectServices,
          selectServicesHint: t.selectServicesHint,
          discount: t.discount,
          discountType: t.discountType,
          discountPercentage: t.discountPercentage,
          discountFixed: t.discountFixed,
          preview: t.preview,
          originalPrice: t.originalPrice,
          bundlePrice: t.bundlePrice,
          totalDuration: t.totalDuration,
          services: t.services,
          cancel: t.cancel,
          create: t.create,
          optionalLimits: t.optionalLimits,
          timeLimitLabel: t.timeLimitLabel,
          timeLimitHint: t.timeLimitHint,
          validFrom: t.validFrom,
          validUntil: t.validUntil,
          quantityLimitLabel: t.quantityLimitLabel,
          quantityLimitHint: t.quantityLimitHint,
          maxQuantity: t.maxQuantity,
          unlimited: t.unlimited,
        }}
        locale={locale}
        currency={currency}
      />

      <DeleteBundleDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        bundle={bundleToDelete}
        beautyPageId={beautyPageId}
        nickname={nickname}
        translations={{
          deleteConfirmTitle: t.deleteConfirmTitle,
          deleteConfirmDescription: t.deleteConfirmDescription,
          deleteConfirmButton: t.deleteConfirmButton,
          cancel: t.cancel,
          services: t.services,
        }}
        locale={locale}
        currency={currency}
      />

      {hiddenServicesData && (
        <HiddenServicesDialog
          open={hiddenServicesDialogOpen}
          onOpenChange={handleHiddenServicesDialogClose}
          bundleName={hiddenServicesData.bundleName}
          hiddenServices={hiddenServicesData.services}
          translations={{
            title: t.hiddenServicesTitle,
            description: t.hiddenServicesDescription,
            hiddenServicesLabel: t.hiddenServicesLabel,
            hint: t.hiddenServicesHint,
            close: t.close,
          }}
        />
      )}
    </>
  );
}
