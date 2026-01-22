"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { Calendar, Clock, Repeat } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { Button } from "@/lib/ui/button";
import { Checkbox } from "@/lib/ui/checkbox";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Select } from "@/lib/ui/select";
import { cn } from "@/lib/utils/cn";
import { createPromotion } from "../_actions/promotion.actions";
import {
  DAY_OPTIONS,
  DISCOUNT_OPTIONS,
  type FlattenedService,
  TIME_OPTIONS,
} from "../_lib/promotions-constants";
import type { PromotionTypeValue } from "../_lib/schemas";

const promotionTypes = ["sale", "slot", "time"] as const;

const createPromotionFormSchema = z.object({
  type: z.enum(promotionTypes),
  serviceId: z.string().min(1, "Select a service"),
  discountPercentage: z.number().min(1).max(50),
  // Sale fields
  endsAt: z.string().optional(),
  // Slot fields
  slotDate: z.string().optional(),
  slotStartTime: z.string().optional(),
  // Time fields
  recurringStartTime: z.string().optional(),
  recurringDays: z.array(z.number()).optional(),
  recurringValidUntil: z.string().optional(),
});

type CreatePromotionFormData = z.infer<typeof createPromotionFormSchema>;

interface CreatePromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beautyPageId: string;
  nickname: string;
  serviceGroups: ServiceGroupWithServices[];
  translations: {
    addPromotion: string;
    selectService: string;
    selectServiceHint: string;
    promotionType: string;
    typeSale: string;
    typeSaleDescription: string;
    typeSlot: string;
    typeSlotDescription: string;
    typeTime: string;
    typeTimeDescription: string;
    discount: string;
    endDate: string;
    slotDate: string;
    slotTime: string;
    recurringTime: string;
    recurringDays: string;
    recurringDaysHint: string;
    validUntil: string;
    validUntilHint: string;
    preview: string;
    originalPrice: string;
    discountedPrice: string;
    cancel: string;
    create: string;
    everyDay: string;
  };
  locale: string;
  currency: string;
}

function flattenServices(
  groups: ServiceGroupWithServices[],
): FlattenedService[] {
  return groups.flatMap((group) =>
    group.services.map((service) => ({
      id: service.id,
      name: service.name,
      groupName: group.name,
      priceCents: service.price_cents,
      durationMinutes: service.duration_minutes,
    })),
  );
}

function formatPrice(cents: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

export function CreatePromotionDialog({
  open,
  onOpenChange,
  beautyPageId,
  nickname,
  serviceGroups,
  translations: t,
  locale,
  currency,
}: CreatePromotionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const services = flattenServices(serviceGroups);
  const serviceItems = services.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.groupName})`,
  }));

  const defaultEndDate = format(addDays(new Date(), 30), "yyyy-MM-dd");
  const defaultSlotDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreatePromotionFormData>({
    resolver: zodResolver(createPromotionFormSchema),
    defaultValues: {
      type: "sale",
      serviceId: "",
      discountPercentage: 10,
      endsAt: defaultEndDate,
      slotDate: defaultSlotDate,
      slotStartTime: "10:00",
      recurringStartTime: "10:00",
      recurringDays: undefined,
      recurringValidUntil: undefined,
    },
  });

  const promotionType = watch("type");
  const selectedServiceId = watch("serviceId");
  const discountPercentage = watch("discountPercentage");
  const recurringDays = watch("recurringDays");

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Calculate preview
  const originalPrice = selectedService?.priceCents ?? 0;
  const discountedPrice = Math.round(
    originalPrice * (1 - discountPercentage / 100),
  );

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setServerError(null);
      reset();
    }
  }

  function onSubmit(data: CreatePromotionFormData) {
    setServerError(null);

    // Find service duration for slot end time calculation
    const service = services.find((s) => s.id === data.serviceId);
    if (!service) {
      setServerError("Service not found");
      return;
    }

    startTransition(async () => {
      const result = await createPromotion({
        beautyPageId,
        nickname,
        serviceId: data.serviceId,
        type: data.type as PromotionTypeValue,
        discountPercentage: data.discountPercentage,
        // Sale fields
        startsAt: data.type === "sale" ? null : null,
        endsAt: data.type === "sale" ? (data.endsAt ?? null) : null,
        // Slot fields
        slotDate: data.type === "slot" ? (data.slotDate ?? null) : null,
        slotStartTime:
          data.type === "slot" ? (data.slotStartTime ?? null) : null,
        slotEndTime:
          data.type === "slot" && data.slotStartTime
            ? addMinutesToTime(data.slotStartTime, service.durationMinutes)
            : null,
        // Time fields
        recurringStartTime:
          data.type === "time" ? (data.recurringStartTime ?? null) : null,
        recurringDays:
          data.type === "time" && data.recurringDays
            ? data.recurringDays
            : null,
        recurringValidUntil:
          data.type === "time" ? (data.recurringValidUntil ?? null) : null,
      });

      if (result.success) {
        onOpenChange(false);
        reset();
      } else {
        setServerError(result.error ?? "Failed to create promotion");
      }
    });
  }

  const typeOptions: {
    value: PromotionTypeValue;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "sale",
      label: t.typeSale,
      description: t.typeSaleDescription,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      value: "slot",
      label: t.typeSlot,
      description: t.typeSlotDescription,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      value: "time",
      label: t.typeTime,
      description: t.typeTimeDescription,
      icon: <Repeat className="h-4 w-4" />,
    },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="md">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {t.addPromotion}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="create-promotion-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Promotion Type Selector */}
            <Field.Root>
              <Field.Label>{t.promotionType}</Field.Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {typeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
                          field.value === option.value
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-muted",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            field.value === option.value
                              ? "bg-accent/20 text-accent"
                              : "bg-muted/20 text-muted",
                          )}
                        >
                          {option.icon}
                        </div>
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                        <span className="text-xs text-muted">
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field.Root>

            {/* Service Selection */}
            <Field.Root>
              <Field.Label>{t.selectService}</Field.Label>
              <Field.Description>{t.selectServiceHint}</Field.Description>
              <Controller
                name="serviceId"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    value={field.value || null}
                    onValueChange={(val) => field.onChange(val ?? "")}
                    items={serviceItems}
                  >
                    <Select.TriggerWrapper>
                      <Select.Trigger
                        placeholder={t.selectService}
                        items={serviceItems}
                        state={errors.serviceId ? "error" : "default"}
                      />
                    </Select.TriggerWrapper>
                    <Select.Content>
                      {serviceGroups.map((group) => (
                        <div key={group.id}>
                          <div className="px-4 py-2 text-xs font-medium text-muted uppercase">
                            {group.name}
                          </div>
                          {group.services.map((service) => (
                            <Select.Item key={service.id} value={service.id}>
                              {service.name} -{" "}
                              {formatPrice(
                                service.price_cents,
                                locale,
                                currency,
                              )}
                            </Select.Item>
                          ))}
                        </div>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
              <Field.Error>{errors.serviceId?.message}</Field.Error>
            </Field.Root>

            {/* Discount Percentage */}
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
            </Field.Root>

            {/* Type-specific fields */}
            {promotionType === "sale" && (
              <Field.Root>
                <Field.Label>{t.endDate}</Field.Label>
                <Controller
                  name="endsAt"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      state={errors.endsAt ? "error" : "default"}
                    />
                  )}
                />
                <Field.Error>{errors.endsAt?.message}</Field.Error>
              </Field.Root>
            )}

            {promotionType === "slot" && (
              <>
                <Field.Root>
                  <Field.Label>{t.slotDate}</Field.Label>
                  <Controller
                    name="slotDate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        min={format(new Date(), "yyyy-MM-dd")}
                        state={errors.slotDate ? "error" : "default"}
                      />
                    )}
                  />
                  <Field.Error>{errors.slotDate?.message}</Field.Error>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t.slotTime}</Field.Label>
                  <Controller
                    name="slotStartTime"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        value={field.value ?? null}
                        onValueChange={(val) => field.onChange(val ?? "10:00")}
                        items={TIME_OPTIONS}
                      >
                        <Select.TriggerWrapper>
                          <Select.Trigger
                            placeholder="Select time"
                            items={TIME_OPTIONS}
                            state={errors.slotStartTime ? "error" : "default"}
                          />
                        </Select.TriggerWrapper>
                        <Select.Content>
                          {TIME_OPTIONS.map((opt) => (
                            <Select.Item key={opt.value} value={opt.value}>
                              {opt.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    )}
                  />
                  <Field.Error>{errors.slotStartTime?.message}</Field.Error>
                </Field.Root>
              </>
            )}

            {promotionType === "time" && (
              <>
                <Field.Root>
                  <Field.Label>{t.recurringTime}</Field.Label>
                  <Controller
                    name="recurringStartTime"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        value={field.value ?? null}
                        onValueChange={(val) => field.onChange(val ?? "10:00")}
                        items={TIME_OPTIONS}
                      >
                        <Select.TriggerWrapper>
                          <Select.Trigger
                            placeholder="Select time"
                            items={TIME_OPTIONS}
                            state={
                              errors.recurringStartTime ? "error" : "default"
                            }
                          />
                        </Select.TriggerWrapper>
                        <Select.Content>
                          {TIME_OPTIONS.map((opt) => (
                            <Select.Item key={opt.value} value={opt.value}>
                              {opt.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    )}
                  />
                  <Field.Error>
                    {errors.recurringStartTime?.message}
                  </Field.Error>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t.recurringDays}</Field.Label>
                  <Field.Description>{t.recurringDaysHint}</Field.Description>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const isSelected = recurringDays?.includes(day.value);
                      return (
                        <label
                          key={day.value}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                            isSelected
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-muted",
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked: boolean) => {
                              const current = recurringDays ?? [];
                              if (checked) {
                                setValue("recurringDays", [
                                  ...current,
                                  day.value,
                                ]);
                              } else {
                                setValue(
                                  "recurringDays",
                                  current.filter((d) => d !== day.value),
                                );
                              }
                            }}
                          />
                          <span className="text-sm">{day.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {(!recurringDays || recurringDays.length === 0) && (
                    <p className="mt-1 text-xs text-muted">{t.everyDay}</p>
                  )}
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t.validUntil}</Field.Label>
                  <Field.Description>{t.validUntilHint}</Field.Description>
                  <Controller
                    name="recurringValidUntil"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                        min={format(new Date(), "yyyy-MM-dd")}
                      />
                    )}
                  />
                </Field.Root>
              </>
            )}

            {/* Preview */}
            {selectedService && (
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <p className="mb-2 text-sm font-medium">{t.preview}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{t.originalPrice}:</span>
                    <span className="line-through">
                      {formatPrice(originalPrice, locale, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.discountedPrice}:</span>
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(discountedPrice, locale, currency)}
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
          <Button
            type="submit"
            form="create-promotion-form"
            loading={isPending}
          >
            {t.create}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
