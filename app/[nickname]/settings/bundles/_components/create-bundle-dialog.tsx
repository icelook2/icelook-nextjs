"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Hash, Percent } from "lucide-react";
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
  FIXED_DISCOUNT_OPTIONS,
  type FlattenedService,
  flattenServices,
  formatDuration,
  formatPrice,
} from "../_lib/bundles-constants";

const createBundleFormSchema = z.object({
  name: z.string().min(1, "Bundle name is required").max(100),
  description: z.string().max(500).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1),
  serviceIds: z.array(z.string()).min(2, "Select at least 2 services"),
  // Optional limits
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  maxQuantity: z.number().int().min(1).optional(),
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
    discountType: string;
    discountPercentage: string;
    discountFixed: string;
    preview: string;
    originalPrice: string;
    bundlePrice: string;
    totalDuration: string;
    services: string;
    cancel: string;
    create: string;
    // Optional limits
    optionalLimits: string;
    timeLimitLabel: string;
    timeLimitHint: string;
    validFrom: string;
    validUntil: string;
    quantityLimitLabel: string;
    quantityLimitHint: string;
    maxQuantity: string;
    unlimited: string;
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
  const [showTimeLimit, setShowTimeLimit] = useState(false);
  const [showQuantityLimit, setShowQuantityLimit] = useState(false);

  const services = flattenServices(serviceGroups);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateBundleFormData>({
    resolver: zodResolver(createBundleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      discountType: "percentage" as const,
      discountValue: 10,
      serviceIds: [],
      validFrom: undefined,
      validUntil: undefined,
      maxQuantity: undefined,
    },
  });

  const selectedServiceIds = watch("serviceIds");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");

  // Calculate preview totals
  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s.id),
  );
  const originalTotal = selectedServices.reduce(
    (sum, s) => sum + s.priceCents,
    0,
  );
  // For fixed discount, value is in cents
  const discountedTotal =
    discountType === "percentage"
      ? Math.round(originalTotal * (1 - discountValue / 100))
      : Math.max(0, originalTotal - discountValue * 100);
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
      setShowTimeLimit(false);
      setShowQuantityLimit(false);
      reset();
    }
  }

  function handleDiscountTypeChange(type: "percentage" | "fixed") {
    setValue("discountType", type);
    // Reset discount value to appropriate default
    setValue("discountValue", type === "percentage" ? 10 : 50);
  }

  function onSubmit(data: CreateBundleFormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await createBundle({
        beautyPageId,
        nickname,
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        // For fixed discount, convert to cents for the server
        discountValue:
          data.discountType === "fixed"
            ? data.discountValue * 100
            : data.discountValue,
        serviceIds: data.serviceIds,
        validFrom: showTimeLimit && data.validFrom ? data.validFrom : null,
        validUntil: showTimeLimit && data.validUntil ? data.validUntil : null,
        maxQuantity:
          showQuantityLimit && data.maxQuantity ? data.maxQuantity : null,
      });

      if (result.success) {
        onOpenChange(false);
        reset();
        setShowTimeLimit(false);
        setShowQuantityLimit(false);
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

            {/* Discount Type Toggle */}
            <Field.Root>
              <Field.Label>{t.discountType}</Field.Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange("percentage")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    discountType === "percentage"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/10",
                  )}
                >
                  <Percent className="h-4 w-4" />
                  {t.discountPercentage}
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange("fixed")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    discountType === "fixed"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/10",
                  )}
                >
                  <Hash className="h-4 w-4" />
                  {t.discountFixed}
                </button>
              </div>
            </Field.Root>

            {/* Discount Value */}
            <Field.Root>
              <Field.Label>{t.discount}</Field.Label>
              <Controller
                name="discountValue"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {(discountType === "percentage"
                      ? DISCOUNT_OPTIONS
                      : FIXED_DISCOUNT_OPTIONS
                    ).map((option) => (
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
                        {discountType === "percentage"
                          ? option.label
                          : `${option.label} ₴`}
                      </button>
                    ))}
                  </div>
                )}
              />
              <Field.Error>{errors.discountValue?.message}</Field.Error>
            </Field.Root>

            {/* Optional Limits Section */}
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-muted">
                {t.optionalLimits}
              </p>

              {/* Time Limit Toggle */}
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={showTimeLimit}
                    onCheckedChange={(checked: boolean) => {
                      setShowTimeLimit(checked);
                      if (!checked) {
                        setValue("validFrom", undefined);
                        setValue("validUntil", undefined);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted" />
                    <span className="text-sm font-medium">
                      {t.timeLimitLabel}
                    </span>
                  </div>
                </label>
                {showTimeLimit && (
                  <div className="ml-7 grid grid-cols-2 gap-3">
                    <Controller
                      name="validFrom"
                      control={control}
                      render={({ field }) => (
                        <Field.Root>
                          <Field.Label className="text-xs">
                            {t.validFrom}
                          </Field.Label>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ?? ""}
                            className="text-sm"
                          />
                        </Field.Root>
                      )}
                    />
                    <Controller
                      name="validUntil"
                      control={control}
                      render={({ field }) => (
                        <Field.Root>
                          <Field.Label className="text-xs">
                            {t.validUntil}
                          </Field.Label>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ?? ""}
                            className="text-sm"
                          />
                        </Field.Root>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Quantity Limit Toggle */}
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={showQuantityLimit}
                    onCheckedChange={(checked: boolean) => {
                      setShowQuantityLimit(checked);
                      if (!checked) {
                        setValue("maxQuantity", undefined);
                      } else {
                        setValue("maxQuantity", 10);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted" />
                    <span className="text-sm font-medium">
                      {t.quantityLimitLabel}
                    </span>
                  </div>
                </label>
                {showQuantityLimit && (
                  <div className="ml-7">
                    <Controller
                      name="maxQuantity"
                      control={control}
                      render={({ field }) => (
                        <Field.Root>
                          <Field.Label className="text-xs">
                            {t.maxQuantity}
                          </Field.Label>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined,
                              )
                            }
                            className="w-24 text-sm"
                          />
                        </Field.Root>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

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
