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
  const [bundleToDelete, setBundleToDelete] =
    useState<ServiceBundleWithServices | null>(null);
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

  function handleToggleActive(bundle: ServiceBundleWithServices) {
    startTransition(async () => {
      await toggleBundleActive({
        bundleId: bundle.id,
        beautyPageId,
        nickname,
        isActive: !bundle.is_active,
      });
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
          preview: t.preview,
          originalPrice: t.originalPrice,
          bundlePrice: t.bundlePrice,
          totalDuration: t.totalDuration,
          services: t.services,
          cancel: t.cancel,
          create: t.create,
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
    </>
  );
}
