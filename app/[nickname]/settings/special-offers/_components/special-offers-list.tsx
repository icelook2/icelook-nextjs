"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Percent,
  Plus,
  Scissors,
  Tag,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Popover } from "@/lib/ui/popover";
import { Select } from "@/lib/ui/select";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { cn } from "@/lib/utils/cn";
import { SimpleDatePicker } from "../../schedule/_components/simple-date-picker";
import {
  createSpecialOffer,
  deleteSpecialOffer,
} from "../_actions/special-offer.actions";

// Type alias for special offer status
type SpecialOfferStatus = Database["public"]["Enums"]["special_offer_status"];

// Time options for select (every 30 minutes from 06:00 to 22:00)
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30; // Start at 06:00
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { value, label: value };
});

// Duration options
const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h 30m" },
  { value: 120, label: "2h" },
  { value: 150, label: "2h 30m" },
  { value: 180, label: "3h" },
];

// Discount preset options
const DISCOUNT_OPTIONS = [
  { value: 10, label: "10%" },
  { value: 15, label: "15%" },
  { value: 20, label: "20%" },
  { value: 25, label: "25%" },
  { value: 30, label: "30%" },
  { value: 40, label: "40%" },
  { value: 50, label: "50%" },
];

// Status badge color classes
const STATUS_COLORS: Record<SpecialOfferStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  booked: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

interface SpecialOfferItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  discountPercentage: number;
  originalPriceCents: number;
  discountedPriceCents: number;
  status: SpecialOfferStatus;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
}

interface SpecialOffersListProps {
  beautyPageId: string;
  nickname: string;
  offers: SpecialOfferItem[];
  serviceGroups: ServiceGroupWithServices[];
  translations: {
    addOffer: string;
    emptyTitle: string;
    emptyDescription: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmButton: string;
    cancel: string;
    statusActive: string;
    statusBooked: string;
    statusExpired: string;
    discountLabel: string;
  };
}

// Flatten services from groups for the select
function flattenServices(groups: ServiceGroupWithServices[]) {
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

const createOfferSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().min(30),
  discountPercentage: z.number().min(5).max(90),
});

type CreateOfferFormData = z.infer<typeof createOfferSchema>;

export function SpecialOffersList({
  beautyPageId,
  nickname,
  offers,
  serviceGroups,
  translations: t,
}: SpecialOffersListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<SpecialOfferItem | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const services = flattenServices(serviceGroups);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateOfferFormData>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      serviceId: "",
      date: new Date(),
      startTime: "10:00",
      durationMinutes: 60,
      discountPercentage: 20,
    },
  });

  const selectedServiceId = watch("serviceId");
  const selectedDate = watch("date");
  const selectedService = services.find((s) => s.id === selectedServiceId);

  function handleCreateDialogOpen(open: boolean) {
    setCreateDialogOpen(open);
    if (!open) {
      setServerError(null);
      reset();
    }
  }

  function handleDeleteClick(offer: SpecialOfferItem) {
    setOfferToDelete(offer);
    setDeleteDialogOpen(true);
  }

  function onCreateSubmit(data: CreateOfferFormData) {
    setServerError(null);

    // Calculate end time from start time and duration
    const [hours, minutes] = data.startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + data.durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    startTransition(async () => {
      const result = await createSpecialOffer({
        beautyPageId,
        nickname,
        serviceId: data.serviceId,
        date: data.date.toISOString().split("T")[0],
        startTime: data.startTime,
        endTime,
        discountPercentage: data.discountPercentage,
      });

      if (result.success) {
        setCreateDialogOpen(false);
        reset();
      } else {
        setServerError(result.error ?? "Failed to create offer");
      }
    });
  }

  function handleDeleteConfirm() {
    if (!offerToDelete) return;

    startTransition(async () => {
      const result = await deleteSpecialOffer({
        id: offerToDelete.id,
        beautyPageId,
        nickname,
      });

      if (result.success) {
        setDeleteDialogOpen(false);
        setOfferToDelete(null);
      }
    });
  }

  function formatDateDisplay(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function formatPrice(cents: number) {
    return `${(cents / 100).toFixed(0)} UAH`;
  }

  function getStatusLabel(status: SpecialOfferStatus) {
    switch (status) {
      case "active":
        return t.statusActive;
      case "booked":
        return t.statusBooked;
      case "expired":
        return t.statusExpired;
      default:
        return status;
    }
  }

  // Separate active and past offers
  const activeOffers = offers.filter((o) => o.status === "active");
  const pastOffers = offers.filter((o) => o.status !== "active");

  return (
    <>
      <SettingsGroup
        title="Special Offers"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            disabled={services.length === 0}
          >
            <Plus className="h-4 w-4" />
            {t.addOffer}
          </Button>
        }
      >
        {offers.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="mx-auto h-12 w-12 text-muted" />
            <h3 className="mt-4 font-semibold">{t.emptyTitle}</h3>
            <p className="mt-2 text-sm text-muted">{t.emptyDescription}</p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => setCreateDialogOpen(true)}
                disabled={services.length === 0}
              >
                <Plus className="h-4 w-4" />
                {t.addOffer}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Active offers */}
            {activeOffers.map((offer, index) => (
              <SettingsRow
                key={offer.id}
                noBorder={
                  index === activeOffers.length - 1 && pastOffers.length === 0
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <Percent className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{offer.service.name}</p>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                          -{offer.discountPercentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDateDisplay(offer.date)}</span>
                        <Clock className="ml-1 h-3.5 w-3.5" />
                        <span>
                          {offer.startTime} - {offer.endTime}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm">
                        <span className="text-muted line-through">
                          {formatPrice(offer.originalPriceCents)}
                        </span>{" "}
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {formatPrice(offer.discountedPriceCents)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-danger hover:bg-danger/10"
                    onClick={() => handleDeleteClick(offer)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </SettingsRow>
            ))}

            {/* Past offers (booked/expired) */}
            {pastOffers.length > 0 && (
              <>
                {pastOffers.map((offer, index) => (
                  <SettingsRow
                    key={offer.id}
                    noBorder={index === pastOffers.length - 1}
                  >
                    <div className="flex items-center justify-between opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/20">
                          <Percent className="h-5 w-5 text-muted" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{offer.service.name}</p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                STATUS_COLORS[offer.status],
                              )}
                            >
                              {getStatusLabel(offer.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDateDisplay(offer.date)}</span>
                            <Clock className="ml-1 h-3.5 w-3.5" />
                            <span>
                              {offer.startTime} - {offer.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SettingsRow>
                ))}
              </>
            )}
          </>
        )}
      </SettingsGroup>

      {/* Create Offer Dialog */}
      <Dialog.Root open={createDialogOpen} onOpenChange={handleCreateDialogOpen}>
        <Dialog.Portal open={createDialogOpen} size="sm">
          <Dialog.Header onClose={() => setCreateDialogOpen(false)}>
            {t.addOffer}
          </Dialog.Header>
          <Dialog.Body>
            <form
              id="create-offer-form"
              onSubmit={handleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              {/* Service Select */}
              <Field.Root>
                <Field.Label>Service</Field.Label>
                <Controller
                  name="serviceId"
                  control={control}
                  render={({ field }) => {
                    const items = services.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.groupName})`,
                    }));
                    return (
                      <Select.Root
                        items={items}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <Select.Trigger
                          items={items}
                          placeholder="Select a service"
                          state={errors.serviceId ? "error" : "default"}
                        />
                        <Select.Content>
                          {services.map((service) => (
                            <Select.Item key={service.id} value={service.id}>
                              <div className="flex items-center gap-2">
                                <Scissors className="h-4 w-4 text-muted" />
                                <span>{service.name}</span>
                                <span className="text-muted">
                                  ({service.groupName})
                                </span>
                              </div>
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    );
                  }}
                />
                <Field.Error>{errors.serviceId?.message}</Field.Error>
              </Field.Root>

              {/* Date - using Popover with SimpleDatePicker */}
              <Field.Root>
                <Field.Label>Date</Field.Label>
                <Popover.Root open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <Popover.Trigger
                    render={
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full justify-start gap-2 font-normal"
                      >
                        <Calendar className="h-4 w-4" />
                        {format(selectedDate, "EEE, MMM d, yyyy")}
                      </Button>
                    }
                  />
                  <Popover.Portal>
                    <Popover.Content className="p-4">
                      <SimpleDatePicker
                        selectedDate={selectedDate}
                        onSelect={(date) => {
                          setValue("date", date);
                          setDatePickerOpen(false);
                        }}
                      />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
                <Field.Error>{errors.date?.message}</Field.Error>
              </Field.Root>

              {/* Start Time */}
              <Field.Root>
                <Field.Label>Start Time</Field.Label>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      items={TIME_OPTIONS}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger
                        items={TIME_OPTIONS}
                        state={errors.startTime ? "error" : "default"}
                      />
                      <Select.Content>
                        {TIME_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
                <Field.Error>{errors.startTime?.message}</Field.Error>
              </Field.Root>

              {/* Duration */}
              <Field.Root>
                <Field.Label>Duration</Field.Label>
                <Controller
                  name="durationMinutes"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      items={DURATION_OPTIONS.map((o) => ({
                        value: String(o.value),
                        label: o.label,
                      }))}
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <Select.Trigger
                        items={DURATION_OPTIONS.map((o) => ({
                          value: String(o.value),
                          label: o.label,
                        }))}
                        state={errors.durationMinutes ? "error" : "default"}
                      />
                      <Select.Content>
                        {DURATION_OPTIONS.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
                <Field.Error>{errors.durationMinutes?.message}</Field.Error>
              </Field.Root>

              {/* Discount */}
              <Field.Root>
                <Field.Label>{t.discountLabel}</Field.Label>
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

              {/* Price Preview */}
              {selectedService && (
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Original price:</span>
                    <span className="line-through">
                      {formatPrice(selectedService.priceCents)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-medium">Discounted price:</span>
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(
                        Math.round(
                          selectedService.priceCents *
                            (1 - watch("discountPercentage") / 100),
                        ),
                      )}
                    </span>
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
            <Button
              type="submit"
              form="create-offer-form"
              loading={isPending}
            >
              {t.addOffer}
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
            {offerToDelete && (
              <div className="mt-4 rounded-lg border border-border bg-muted/10 p-3">
                <p className="font-medium">{offerToDelete.service.name}</p>
                <p className="text-sm text-muted">
                  {formatDateDisplay(offerToDelete.date)} at{" "}
                  {offerToDelete.startTime}
                </p>
                <p className="text-sm">
                  <span className="text-muted line-through">
                    {formatPrice(offerToDelete.originalPriceCents)}
                  </span>{" "}
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatPrice(offerToDelete.discountedPriceCents)}
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
