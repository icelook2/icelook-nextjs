"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { Button } from "@/lib/ui/button";
import { Checkbox } from "@/lib/ui/checkbox";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { cn } from "@/lib/utils/cn";
import { createBundle } from "../_actions/bundle.actions";
import {
  DISCOUNT_OPTIONS,
  type FlattenedService,
  flattenServices,
  formatDuration,
  formatPrice,
} from "../_lib/bundles-constants";

const createBundleFormSchema = z.object({
  name: z.string().min(1, "Bundle name is required").max(100),
  description: z.string().max(500).optional(),
  discountPercentage: z.number().min(1).max(90),
  serviceIds: z.array(z.string()).min(2, "Select at least 2 services"),
});

type CreateBundleFormData = z.infer<typeof createBundleFormSchema>;

interface CreateBundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beautyPageId: string;
  nickname: string;
  serviceGroups: ServiceGroupWithServices[];
  translations: {
    addBundle: string;
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
    cancel: string;
    create: string;
  };
  locale: string;
  currency: string;
}

export function CreateBundleDialog({
  open,
  onOpenChange,
  beautyPageId,
  nickname,
  serviceGroups,
  translations: t,
  locale,
  currency,
}: CreateBundleDialogProps) {
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

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
      reset();
    }
  }

  function onSubmit(data: CreateBundleFormData) {
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
        onOpenChange(false);
        reset();
      } else {
        setServerError(result.error ?? "Failed to create bundle");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="md">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t.addBundle}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="create-bundle-form"
            onSubmit={handleSubmit(onSubmit)}
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
                  <ServiceSelector
                    serviceGroups={serviceGroups}
                    services={services}
                    value={field.value}
                    onChange={field.onChange}
                    locale={locale}
                    currency={currency}
                  />
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
                      {formatPrice(originalTotal, locale, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.bundlePrice}:</span>
                    <span className="text-lg font-semibold text-violet-600 dark:text-violet-400">
                      {formatPrice(discountedTotal, locale, currency)}
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button type="submit" form="create-bundle-form" loading={isPending}>
            {t.create}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ServiceSelectorProps {
  serviceGroups: ServiceGroupWithServices[];
  services: FlattenedService[];
  value: string[];
  onChange: (value: string[]) => void;
  locale: string;
  currency: string;
}

function ServiceSelector({
  serviceGroups,
  services,
  value,
  onChange,
  locale,
  currency,
}: ServiceSelectorProps) {
  return (
    <div className="max-h-60 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
      {serviceGroups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 text-xs font-medium text-muted uppercase">
            {group.name}
          </p>
          <div className="space-y-2">
            {group.services.map((service) => {
              const isSelected = value.includes(service.id);
              const flatService = services.find((s) => s.id === service.id);
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
                        onChange([...value, service.id]);
                      } else {
                        onChange(value.filter((id) => id !== service.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{service.name}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {formatPrice(service.price_cents, locale, currency)}
                    </p>
                    <p className="text-muted">
                      {formatDuration(flatService?.durationMinutes ?? 0)}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
