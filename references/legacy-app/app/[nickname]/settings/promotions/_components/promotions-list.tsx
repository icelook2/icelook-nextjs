"use client";

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Percent,
  Plus,
  Repeat,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { cn } from "@/lib/utils/cn";
import {
  type FlattenedService,
  type PromotionItem,
  STATUS_COLORS,
  TYPE_COLORS,
} from "../_lib/promotions-constants";
import { CreatePromotionDialog } from "./create-promotion-dialog";
import { DeletePromotionDialog } from "./delete-promotion-dialog";

interface PromotionsListProps {
  beautyPageId: string;
  nickname: string;
  promotions: PromotionItem[];
  serviceGroups: ServiceGroupWithServices[];
  translations: {
    addPromotion: string;
    emptyTitle: string;
    emptyDescription: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmButton: string;
    cancel: string;
    statusActive: string;
    statusBooked: string;
    statusExpired: string;
    statusInactive: string;
    discountLabel: string;
    typeSale: string;
    typeSlot: string;
    typeTime: string;
    untilDate: string;
    everyDay: string;
    weekdays: string;
    // Create dialog translations
    selectService: string;
    selectServiceHint: string;
    promotionType: string;
    typeSaleDescription: string;
    typeSlotDescription: string;
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
    create: string;
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PromotionsList({
  beautyPageId,
  nickname,
  promotions,
  serviceGroups,
  translations: t,
  locale,
  currency,
}: PromotionsListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionItem | null>(null);

  const services = flattenServices(serviceGroups);
  const activePromotions = promotions.filter((p) => p.status === "active");
  const pastPromotions = promotions.filter((p) => p.status !== "active");

  const statusLabels: Record<string, string> = {
    active: t.statusActive,
    booked: t.statusBooked,
    expired: t.statusExpired,
    inactive: t.statusInactive,
  };

  const typeLabels: Record<string, string> = {
    sale: t.typeSale,
    slot: t.typeSlot,
    time: t.typeTime,
  };

  function formatDate(dateString: string | null) {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM d, yyyy");
  }

  function formatTime(timeString: string | null) {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  }

  function formatRecurringDays(days: number[] | null): string {
    if (days === null) {
      return t.everyDay;
    }
    if (
      days.length === 5 &&
      days.includes(1) &&
      days.includes(2) &&
      days.includes(3) &&
      days.includes(4) &&
      days.includes(5)
    ) {
      return t.weekdays;
    }
    return days.map((d) => DAY_NAMES[d]).join(", ");
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function getPromotionDescription(promo: PromotionItem): string {
    if (promo.type === "sale") {
      return `${t.untilDate} ${formatDate(promo.endsAt)}`;
    }
    if (promo.type === "slot") {
      return `${formatDate(promo.slotDate)}, ${formatTime(promo.slotStartTime)}`;
    }
    if (promo.type === "time") {
      return `${formatRecurringDays(promo.recurringDays)} @ ${formatTime(promo.recurringStartTime)}`;
    }
    return "";
  }

  function getTypeIcon(type: string) {
    if (type === "sale") {
      return <Calendar className="h-4 w-4" />;
    }
    if (type === "slot") {
      return <Clock className="h-4 w-4" />;
    }
    return <Repeat className="h-4 w-4" />;
  }

  function handleDeleteClick(promo: PromotionItem) {
    setSelectedPromotion(promo);
    setDeleteDialogOpen(true);
  }

  return (
    <>
      <SettingsGroup
        title={t.addPromotion.replace("Add ", "").replace("Додати ", "")}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            disabled={services.length === 0}
          >
            <Plus className="h-4 w-4" />
            {t.addPromotion}
          </Button>
        }
      >
        {promotions.length === 0 ? (
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
                {t.addPromotion}
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Active Promotions */}
            {activePromotions.map((promo) => (
              <div
                key={promo.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      TYPE_COLORS[promo.type],
                    )}
                  >
                    {getTypeIcon(promo.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{promo.service.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[promo.status],
                        )}
                      >
                        {statusLabels[promo.status]}
                      </span>
                      <span className="text-xs text-muted">
                        {typeLabels[promo.type]}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {getPromotionDescription(promo)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">
                        -{promo.discountPercentage}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted line-through">
                        {formatPrice(promo.originalPriceCents)}
                      </span>
                      <span className="ml-1 font-medium">
                        {formatPrice(promo.discountedPriceCents)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(promo)}
                  >
                    <Trash2 className="h-4 w-4 text-muted" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Past Promotions */}
            {pastPromotions.length > 0 && (
              <div className="bg-subtle/50">
                {pastPromotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="flex items-center justify-between gap-4 border-t border-border p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800">
                        {getTypeIcon(promo.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{promo.service.name}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              STATUS_COLORS[promo.status],
                            )}
                          >
                            {statusLabels[promo.status]}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          {getPromotionDescription(promo)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted">
                      -{promo.discountPercentage}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SettingsGroup>

      <CreatePromotionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        beautyPageId={beautyPageId}
        nickname={nickname}
        serviceGroups={serviceGroups}
        translations={{
          addPromotion: t.addPromotion,
          selectService: t.selectService,
          selectServiceHint: t.selectServiceHint,
          promotionType: t.promotionType,
          typeSale: t.typeSale,
          typeSaleDescription: t.typeSaleDescription,
          typeSlot: t.typeSlot,
          typeSlotDescription: t.typeSlotDescription,
          typeTime: t.typeTime,
          typeTimeDescription: t.typeTimeDescription,
          discount: t.discount,
          endDate: t.endDate,
          slotDate: t.slotDate,
          slotTime: t.slotTime,
          recurringTime: t.recurringTime,
          recurringDays: t.recurringDays,
          recurringDaysHint: t.recurringDaysHint,
          validUntil: t.validUntil,
          validUntilHint: t.validUntilHint,
          preview: t.preview,
          originalPrice: t.originalPrice,
          discountedPrice: t.discountedPrice,
          cancel: t.cancel,
          create: t.create,
          everyDay: t.everyDay,
        }}
        locale={locale}
        currency={currency}
      />

      <DeletePromotionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        promotion={selectedPromotion}
        beautyPageId={beautyPageId}
        nickname={nickname}
        translations={{
          deleteConfirmTitle: t.deleteConfirmTitle,
          deleteConfirmDescription: t.deleteConfirmDescription,
          deleteConfirmButton: t.deleteConfirmButton,
          cancel: t.cancel,
          typeSale: t.typeSale,
          typeSlot: t.typeSlot,
          typeTime: t.typeTime,
          untilDate: t.untilDate,
          everyDay: t.everyDay,
        }}
        locale={locale}
        currency={currency}
      />
    </>
  );
}
