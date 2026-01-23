"use client";

import { format } from "date-fns";
import {
  Box,
  Calendar,
  Clock,
  ExternalLink,
  Package,
  Pencil,
  Percent,
  Repeat,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Service, ServiceGroupWithServices } from "@/lib/queries";
import type { PromotionWithService } from "@/lib/queries/promotions";
import type { ServiceResourceWithDetails } from "@/lib/types/resources";
import {
  getActiveBundlesForServiceAction,
  toggleServiceVisibility,
} from "../_actions";
import type { ServiceBundleWithServices } from "@/lib/types/bundles";
import { Button } from "@/lib/ui/button";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { Switch } from "@/lib/ui/switch";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatPrice } from "./constants";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { EditServiceDialog } from "./edit-service-dialog";
import { HideServiceDialog } from "./hide-service-dialog";

interface ServiceDetailsProps {
  service: Service;
  serviceGroup: ServiceGroupWithServices;
  nickname: string;
  promotions: PromotionWithService[];
  bundles: ServiceBundleWithServices[];
  serviceResources: ServiceResourceWithDetails[];
}

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  booked: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const TYPE_COLORS: Record<string, string> = {
  sale: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  slot: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  time: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ServiceDetails({
  service,
  serviceGroup,
  nickname,
  promotions,
  bundles,
  serviceResources,
}: ServiceDetailsProps) {
  const t = useTranslations("service_groups");
  const tPromo = useTranslations("promotions_settings");
  const tBundle = useTranslations("bundles_settings");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [affectedBundles, setAffectedBundles] = useState<
    { id: string; name: string }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  async function handleVisibilityToggle(checked: boolean) {
    // If turning on (showing), just do it directly
    if (checked) {
      startTransition(async () => {
        await toggleServiceVisibility({
          id: service.id,
          isHidden: false,
          nickname,
          groupId: serviceGroup.id,
        });
      });
      return;
    }

    // If turning off (hiding), check for active bundles first
    startTransition(async () => {
      const activeBundles = await getActiveBundlesForServiceAction(service.id);

      if (activeBundles.length > 0) {
        // Show confirmation dialog
        setAffectedBundles(activeBundles);
        setHideDialogOpen(true);
      } else {
        // No bundles affected, hide directly
        await toggleServiceVisibility({
          id: service.id,
          isHidden: true,
          nickname,
          groupId: serviceGroup.id,
        });
      }
    });
  }

  const activePromotions = promotions.filter((p) => p.status === "active");
  const activeBundles = bundles.filter((b) => b.is_active);

  function formatDateShort(dateString: string | null) {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM d");
  }

  function formatTimeShort(timeString: string | null) {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  }

  function formatRecurringDays(days: number[] | null): string {
    if (days === null) return tPromo("every_day");
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
      return tPromo("weekdays");
    }
    return days.map((d) => DAY_NAMES[d]).join(", ");
  }

  function getPromotionDescription(promo: PromotionWithService): string {
    if (promo.type === "sale") {
      return `${tPromo("until_date")} ${formatDateShort(promo.ends_at)}`;
    }
    if (promo.type === "slot") {
      return `${formatDateShort(promo.slot_date)} @ ${formatTimeShort(promo.slot_start_time)}`;
    }
    if (promo.type === "time") {
      return `${formatRecurringDays(promo.recurring_days)} @ ${formatTimeShort(promo.recurring_start_time)}`;
    }
    return "";
  }

  function getTypeIcon(type: string) {
    if (type === "sale") return <Calendar className="h-4 w-4" />;
    if (type === "slot") return <Clock className="h-4 w-4" />;
    return <Repeat className="h-4 w-4" />;
  }

  return (
    <div className="space-y-6">
      {/* Service settings */}
      <SettingsGroup
        title={t("service_settings")}
        description={t("service_settings_description")}
      >
        <SettingsRow className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">{t("service_name_label")}</p>
            <p className="font-medium">{service.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </SettingsRow>

        {service.description && (
          <SettingsRow>
            <div>
              <p className="text-sm text-muted">
                {t("service_description_label")}
              </p>
              <p className="font-medium">{service.description}</p>
            </div>
          </SettingsRow>
        )}

        <SettingsRow>
          <div>
            <p className="text-sm text-muted">{t("price_label")}</p>
            <p className="font-medium">{formatPrice(service.price_cents)} ₴</p>
          </div>
        </SettingsRow>

        <SettingsRow>
          <div>
            <p className="text-sm text-muted">{t("duration_label")}</p>
            <p className="font-medium">
              {formatDuration(service.duration_minutes)}
            </p>
          </div>
        </SettingsRow>

        <SettingsRow className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("service_visibility")}</p>
            <p className="text-sm text-muted">
              {service.is_hidden
                ? t("service_hidden_hint")
                : t("service_visible_hint")}
            </p>
          </div>
          <Switch
            checked={!service.is_hidden}
            onCheckedChange={handleVisibilityToggle}
            disabled={isPending}
          />
        </SettingsRow>

        <SettingsRow noBorder className="flex items-center justify-between">
          <div>
            <p className="font-medium text-danger">{t("delete_service")}</p>
            <p className="text-sm text-muted">{t("delete_service_hint")}</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t("delete")}
          </Button>
        </SettingsRow>
      </SettingsGroup>

      {/* Promotions section */}
      <SettingsGroup
        title={t("promotions")}
        description={t("promotions_description")}
        action={
          <Link href={`/${nickname}/settings/promotions`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
              {t("manage_promotions")}
            </Button>
          </Link>
        }
      >
        {activePromotions.length === 0 ? (
          <div className="p-6 text-center">
            <Tag className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-2 text-sm text-muted">{t("no_promotions")}</p>
            <Link href={`/${nickname}/settings/promotions`}>
              <Button variant="secondary" size="sm" className="mt-3">
                {tPromo("add_promotion")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activePromotions.map((promo) => (
              <div
                key={promo.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      TYPE_COLORS[promo.type],
                    )}
                  >
                    {getTypeIcon(promo.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[promo.status],
                        )}
                      >
                        {tPromo(`status_${promo.status}`)}
                      </span>
                      <span className="text-xs text-muted">
                        {tPromo(`type_${promo.type}`)}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {getPromotionDescription(promo)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <Percent className="h-3 w-3" />
                  <span className="font-semibold">
                    -{promo.discount_percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsGroup>

      {/* Bundles section */}
      <SettingsGroup
        title={t("bundles")}
        description={t("bundles_description")}
        action={
          <Link href={`/${nickname}/settings/bundles`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
              {t("manage_bundles")}
            </Button>
          </Link>
        }
      >
        {activeBundles.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-2 text-sm text-muted">{t("no_bundles")}</p>
            <Link href={`/${nickname}/settings/bundles`}>
              <Button variant="secondary" size="sm" className="mt-3">
                {tBundle("add_bundle")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeBundles.map((bundle) => (
              <div
                key={bundle.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{bundle.name}</p>
                    <p className="text-sm text-muted">
                      {bundle.services.length} {t("services_count")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                  <Percent className="h-3 w-3" />
                  <span className="font-semibold">
                    -{bundle.discount_percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsGroup>

      {/* Resources section */}
      <SettingsGroup
        title={t("resources")}
        description={t("resources_description")}
        action={
          <Link href={`/${nickname}/settings/resources`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
              {t("manage_resources")}
            </Button>
          </Link>
        }
      >
        {serviceResources.length === 0 ? (
          <div className="p-6 text-center">
            <Box className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-2 text-sm text-muted">{t("no_resources")}</p>
            <Link href={`/${nickname}/settings/resources`}>
              <Button variant="secondary" size="sm" className="mt-3">
                {t("link_resource")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {serviceResources.map((sr) => (
              <div
                key={sr.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    <Box className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{sr.resource.name}</p>
                    <p className="text-sm text-muted">
                      {t("resource_usage", {
                        amount: `${sr.defaultAmount} ${sr.resource.unit}`,
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    sr.resource.currentStock <= 0
                      ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                      : sr.resource.currentStock < sr.defaultAmount * 5
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  )}
                >
                  {sr.resource.currentStock} {sr.resource.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </SettingsGroup>

      <EditServiceDialog
        service={service}
        groupId={serviceGroup.id}
        nickname={nickname}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteServiceDialog
        service={service}
        groupId={serviceGroup.id}
        nickname={nickname}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      <HideServiceDialog
        service={service}
        groupId={serviceGroup.id}
        nickname={nickname}
        affectedBundles={affectedBundles}
        open={hideDialogOpen}
        onOpenChange={setHideDialogOpen}
        onSuccess={() => setAffectedBundles([])}
      />
    </div>
  );
}
