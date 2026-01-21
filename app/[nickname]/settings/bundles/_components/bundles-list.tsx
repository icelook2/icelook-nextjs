"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Package, Plus, Scissors, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import type { ServiceBundleWithServices } from "@/lib/types/bundles";
import { Button } from "@/lib/ui/button";
import { Checkbox } from "@/lib/ui/checkbox";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { cn } from "@/lib/utils/cn";
import {
  createBundle,
  deleteBundle,
  toggleBundleActive,
} from "../_actions/bundle.actions";

// Discount preset options
const DISCOUNT_OPTIONS = [
  { value: 5, label: "5%" },
  { value: 10, label: "10%" },
  { value: 15, label: "15%" },
  { value: 20, label: "20%" },
  { value: 25, label: "25%" },
  { value: 30, label: "30%" },
];

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

// Flatten services from groups for selection
function flattenServices(groups: ServiceGroupWithServices[]) {
  return groups.flatMap((group) =>
    group.services.map((service) => ({
      id: service.id,
      name: service.name,
      groupName: group.name,
      groupId: group.id,
      priceCents: service.price_cents,
      durationMinutes: service.duration_minutes,
    })),
  );
}

const createBundleFormSchema = z.object({
  name: z.string().min(1, "Bundle name is required").max(100),
  description: z.string().max(500).optional(),
  discountPercentage: z.number().min(1).max(90),
  serviceIds: z.array(z.string()).min(2, "Select at least 2 services"),
});

type CreateBundleFormData = z.infer<typeof createBundleFormSchema>;

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
  const [serverError, setServerError] = useState<string | null>(null);

  const services = flattenServices(serviceGroups);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateBundleFormData>({
    resolver: zodResolver(createBundleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      discountPercentage: 10,
      serviceIds: [],
    },
  });

  const selectedServiceIds = watch("serviceIds");
  const discountPercentage = watch("discountPercentage");

  // Calculate preview totals
  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s.id),
  );
  const originalTotal = selectedServices.reduce(
    (sum, s) => sum + s.priceCents,
    0,
  );
  const discountedTotal = Math.round(
    originalTotal * (1 - discountPercentage / 100),
  );
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );

  function handleCreateDialogOpen(open: boolean) {
    setCreateDialogOpen(open);
    if (!open) {
      setServerError(null);
      reset();
    }
  }

  function handleDeleteClick(bundle: ServiceBundleWithServices) {
    setBundleToDelete(bundle);
    setDeleteDialogOpen(true);
  }

  function onCreateSubmit(data: CreateBundleFormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await createBundle({
        beautyPageId,
        nickname,
        name: data.name,
        description: data.description,
        discountPercentage: data.discountPercentage,
        serviceIds: data.serviceIds,
      });

      if (result.success) {
        setCreateDialogOpen(false);
        reset();
      } else {
        setServerError(result.error ?? "Failed to create bundle");
      }
    });
  }

  function handleDeleteConfirm() {
    if (!bundleToDelete) return;

    startTransition(async () => {
      const result = await deleteBundle({
        bundleId: bundleToDelete.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        setDeleteDialogOpen(false);
        setBundleToDelete(null);
      }
    });
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

  function formatPrice(cents: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function formatDuration(minutes: number) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
            {/* Active bundles */}
            {activeBundles.map((bundle, index) => (
              <SettingsRow
                key={bundle.id}
                noBorder={
                  index === activeBundles.length - 1 &&
                  inactiveBundles.length === 0
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{bundle.name}</p>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                          -{bundle.discount_percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Scissors className="h-3.5 w-3.5" />
                        <span>
                          {bundle.services.length} {t.services}
                        </span>
                        <Clock className="ml-1 h-3.5 w-3.5" />
                        <span>
                          {formatDuration(bundle.total_duration_minutes)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm">
                        <span className="text-muted line-through">
                          {formatPrice(bundle.original_total_cents)}
                        </span>{" "}
                        <span className="font-medium text-violet-600 dark:text-violet-400">
                          {formatPrice(bundle.discounted_total_cents)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(bundle)}
                      disabled={isPending}
                    >
                      {t.deactivate}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-danger hover:bg-danger/10"
                      onClick={() => handleDeleteClick(bundle)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SettingsRow>
            ))}

            {/* Inactive bundles */}
            {inactiveBundles.length > 0 && (
              <>
                {inactiveBundles.map((bundle, index) => (
                  <SettingsRow
                    key={bundle.id}
                    noBorder={index === inactiveBundles.length - 1}
                  >
                    <div className="flex items-center justify-between opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/20">
                          <Package className="h-5 w-5 text-muted" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{bundle.name}</p>
                            <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs font-medium text-muted">
                              {t.inactive}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Scissors className="h-3.5 w-3.5" />
                            <span>
                              {bundle.services.length} {t.services}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(bundle)}
                          disabled={isPending}
                        >
                          {t.activate}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-danger hover:bg-danger/10"
                          onClick={() => handleDeleteClick(bundle)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </SettingsRow>
                ))}
              </>
            )}
          </>
        )}
      </SettingsGroup>

      {/* Create Bundle Dialog */}
      <Dialog.Root
        open={createDialogOpen}
        onOpenChange={handleCreateDialogOpen}
      >
        <Dialog.Portal open={createDialogOpen} size="md">
          <Dialog.Header onClose={() => setCreateDialogOpen(false)}>
            {t.addBundle}
          </Dialog.Header>
          <Dialog.Body>
            <form
              id="create-bundle-form"
              onSubmit={handleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              {/* Bundle Name */}
              <Field.Root>
                <Field.Label>{t.bundleName}</Field.Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t.bundleNamePlaceholder}
                      state={errors.name ? "error" : "default"}
                    />
                  )}
                />
                <Field.Error>{errors.name?.message}</Field.Error>
              </Field.Root>

              {/* Description (optional) */}
              <Field.Root>
                <Field.Label>{t.description}</Field.Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder={t.descriptionPlaceholder} />
                  )}
                />
              </Field.Root>

              {/* Service Selection */}
              <Field.Root>
                <Field.Label>{t.selectServices}</Field.Label>
                <Field.Description>{t.selectServicesHint}</Field.Description>
                <Controller
                  name="serviceIds"
                  control={control}
                  render={({ field }) => (
                    <div className="max-h-60 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
                      {serviceGroups.map((group) => (
                        <div key={group.id}>
                          <p className="mb-2 text-xs font-medium text-muted uppercase">
                            {group.name}
                          </p>
                          <div className="space-y-2">
                            {group.services.map((service) => {
                              const isSelected = field.value.includes(
                                service.id,
                              );
                              return (
                                <label
                                  key={service.id}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors",
                                    isSelected
                                      ? "border-primary bg-primary/5"
                                      : "hover:bg-muted/10",
                                  )}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked: boolean) => {
                                      if (checked) {
                                        field.onChange([
                                          ...field.value,
                                          service.id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            (id) => id !== service.id,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {service.name}
                                    </p>
                                  </div>
                                  <div className="text-right text-sm">
                                    <p className="font-medium">
                                      {formatPrice(service.price_cents)}
                                    </p>
                                    <p className="text-muted">
                                      {formatDuration(service.duration_minutes)}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Field.Error>{errors.serviceIds?.message}</Field.Error>
              </Field.Root>

              {/* Discount */}
              <Field.Root>
                <Field.Label>{t.discount}</Field.Label>
                <Controller
                  name="discountPercentage"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {DISCOUNT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                            field.value === option.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/20 hover:bg-muted/30",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
                <Field.Error>{errors.discountPercentage?.message}</Field.Error>
              </Field.Root>

              {/* Preview */}
              {selectedServiceIds.length >= 2 && (
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="mb-2 text-sm font-medium">{t.preview}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">{t.services}:</span>
                      <span>
                        {selectedServices.map((s) => s.name).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">{t.totalDuration}:</span>
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">{t.originalPrice}:</span>
                      <span className="line-through">
                        {formatPrice(originalTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.bundlePrice}:</span>
                      <span className="text-lg font-semibold text-violet-600 dark:text-violet-400">
                        {formatPrice(discountedTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {serverError && (
                <p className="text-sm text-danger">{serverError}</p>
              )}
            </form>
          </Dialog.Body>
          <Dialog.Footer className="justify-end">
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" form="create-bundle-form" loading={isPending}>
              {t.create}
            </Button>
          </Dialog.Footer>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal open={deleteDialogOpen} size="sm">
          <Dialog.Header onClose={() => setDeleteDialogOpen(false)}>
            {t.deleteConfirmTitle}
          </Dialog.Header>
          <Dialog.Body>
            <p className="text-muted">{t.deleteConfirmDescription}</p>
            {bundleToDelete && (
              <div className="mt-4 rounded-lg border border-border bg-muted/10 p-3">
                <p className="font-medium">{bundleToDelete.name}</p>
                <p className="text-sm text-muted">
                  {bundleToDelete.services.length} {t.services}
                </p>
                <p className="text-sm">
                  <span className="text-muted line-through">
                    {formatPrice(bundleToDelete.original_total_cents)}
                  </span>{" "}
                  <span className="font-medium text-violet-600 dark:text-violet-400">
                    {formatPrice(bundleToDelete.discounted_total_cents)}
                  </span>
                </p>
              </div>
            )}
          </Dialog.Body>
          <Dialog.Footer className="justify-end">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="danger"
              loading={isPending}
              onClick={handleDeleteConfirm}
            >
              {t.deleteConfirmButton}
            </Button>
          </Dialog.Footer>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
