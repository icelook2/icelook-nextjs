"use client";

import { Box, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import type { ResourceWithStatus } from "@/lib/types/resources";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { toggleResourceActive } from "../_actions/resource.actions";
import { CreateResourceDialog } from "./create-resource-dialog";
import { DeleteResourceDialog } from "./delete-resource-dialog";
import { ResourceCard } from "./resource-card";

interface ResourcesListProps {
  beautyPageId: string;
  nickname: string;
  resources: ResourceWithStatus[];
  translations: {
    title: string;
    addResource: string;
    emptyTitle: string;
    emptyDescription: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmButton: string;
    cancel: string;
    resourceName: string;
    resourceNamePlaceholder: string;
    unit: string;
    unitPlaceholder: string;
    costPerUnit: string;
    currentStock: string;
    lowStockThreshold: string;
    lowStockThresholdHint: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    active: string;
    inactive: string;
    activate: string;
    deactivate: string;
    adjustStock: string;
    adjustStockAdd: string;
    adjustStockRemove: string;
    adjustment: string;
    save: string;
    create: string;
    edit: string;
    delete: string;
    totalValue: string;
    linkedServices: string;
  };
  currency: string;
  locale: string;
}

export function ResourcesList({
  beautyPageId,
  nickname,
  resources,
  translations: t,
  currency,
  locale,
}: ResourcesListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] =
    useState<ResourceWithStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeleteClick(resource: ResourceWithStatus) {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  }

  function handleDeleteDialogClose(open: boolean) {
    setDeleteDialogOpen(open);
    if (!open) {
      setResourceToDelete(null);
    }
  }

  function handleToggleActive(resource: ResourceWithStatus) {
    startTransition(async () => {
      await toggleResourceActive({
        resourceId: resource.id,
        beautyPageId,
        nickname,
        isActive: !resource.is_active,
      });
    });
  }

  // Separate active and inactive resources
  const activeResources = resources.filter((r) => r.is_active);
  const inactiveResources = resources.filter((r) => !r.is_active);

  return (
    <>
      <SettingsGroup
        title={t.title}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t.addResource}
          </Button>
        }
      >
        {resources.length === 0 ? (
          <div className="p-8 text-center">
            <Box className="mx-auto h-12 w-12 text-muted" />
            <h3 className="mt-4 font-semibold">{t.emptyTitle}</h3>
            <p className="mt-2 text-sm text-muted">{t.emptyDescription}</p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t.addResource}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {activeResources.map((resource, index) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                variant="active"
                noBorder={
                  index === activeResources.length - 1 &&
                  inactiveResources.length === 0
                }
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteClick}
                isPending={isPending}
                beautyPageId={beautyPageId}
                nickname={nickname}
                translations={{
                  inStock: t.inStock,
                  lowStock: t.lowStock,
                  outOfStock: t.outOfStock,
                  activate: t.activate,
                  deactivate: t.deactivate,
                  inactive: t.inactive,
                  totalValue: t.totalValue,
                  adjustStock: t.adjustStock,
                  adjustStockAdd: t.adjustStockAdd,
                  adjustStockRemove: t.adjustStockRemove,
                  save: t.save,
                  cancel: t.cancel,
                }}
                locale={locale}
                currency={currency}
              />
            ))}

            {inactiveResources.map((resource, index) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                variant="inactive"
                noBorder={index === inactiveResources.length - 1}
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteClick}
                isPending={isPending}
                beautyPageId={beautyPageId}
                nickname={nickname}
                translations={{
                  inStock: t.inStock,
                  lowStock: t.lowStock,
                  outOfStock: t.outOfStock,
                  activate: t.activate,
                  deactivate: t.deactivate,
                  inactive: t.inactive,
                  totalValue: t.totalValue,
                  adjustStock: t.adjustStock,
                  adjustStockAdd: t.adjustStockAdd,
                  adjustStockRemove: t.adjustStockRemove,
                  save: t.save,
                  cancel: t.cancel,
                }}
                locale={locale}
                currency={currency}
              />
            ))}
          </>
        )}
      </SettingsGroup>

      <CreateResourceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        beautyPageId={beautyPageId}
        nickname={nickname}
        translations={{
          addResource: t.addResource,
          resourceName: t.resourceName,
          resourceNamePlaceholder: t.resourceNamePlaceholder,
          unit: t.unit,
          unitPlaceholder: t.unitPlaceholder,
          costPerUnit: t.costPerUnit,
          currentStock: t.currentStock,
          lowStockThreshold: t.lowStockThreshold,
          lowStockThresholdHint: t.lowStockThresholdHint,
          cancel: t.cancel,
          create: t.create,
        }}
        currency={currency}
      />

      <DeleteResourceDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        resource={resourceToDelete}
        beautyPageId={beautyPageId}
        nickname={nickname}
        translations={{
          deleteConfirmTitle: t.deleteConfirmTitle,
          deleteConfirmDescription: t.deleteConfirmDescription,
          deleteConfirmButton: t.deleteConfirmButton,
          cancel: t.cancel,
        }}
      />
    </>
  );
}
