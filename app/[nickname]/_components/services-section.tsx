"use client";

/**
 * Services Section with Inline Bundles and Promotions
 *
 * Displays services grouped by category with:
 * - "Deals" group at the top (bundles + standalone promotions)
 * - Service groups below with inline promotion badges
 *
 * Bundles are first-class bookable entities - selecting a bundle
 * books the entire bundle, not individual services.
 */

import { Check } from "lucide-react";
import type { ProfileService, ProfileServiceGroup } from "@/lib/queries/beauty-page-profile";
import type { PublicPromotion } from "@/lib/queries/promotions";
import type { PublicBundle } from "@/lib/types/bundles";
import { cn } from "@/lib/utils/cn";
import {
  type DurationLabels,
  formatDuration,
  formatPrice,
} from "@/lib/utils/price-range";
import { useServiceSelection } from "./service-selection-context";

// ============================================================================
// Types
// ============================================================================

interface ServicesSectionProps {
  serviceGroups: ProfileServiceGroup[];
  bundles?: PublicBundle[];
  promotions?: PublicPromotion[];
  title: string;
  emptyMessage: string;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
  translations?: {
    dealsTitle?: string;
    bundleLabel?: string;
    promoLabel?: string;
  };
}

// ============================================================================
// Component
// ============================================================================

export function ServicesSection({
  serviceGroups,
  bundles = [],
  promotions = [],
  title,
  emptyMessage,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  translations,
}: ServicesSectionProps) {
  // Filter groups that have at least one service
  const groupsWithServices = serviceGroups.filter(
    (group) => group.services.length > 0,
  );

  const isEmpty = groupsWithServices.length === 0;

  // Create a map of serviceId -> best promotion (highest discount)
  const servicePromotionMap = new Map<string, PublicPromotion>();
  for (const promo of promotions) {
    const existing = servicePromotionMap.get(promo.service.id);
    if (!existing || promo.discountPercentage > existing.discountPercentage) {
      servicePromotionMap.set(promo.service.id, promo);
    }
  }

  // Find standalone promotions (services not in any group - shown in deals section)
  const serviceIdsInGroups = new Set(
    groupsWithServices.flatMap((g) => g.services.map((s) => s.id)),
  );
  const standalonePromotions = promotions.filter(
    (p) => !serviceIdsInGroups.has(p.service.id),
  );

  const hasDeals = bundles.length > 0 || standalonePromotions.length > 0;

  return (
    <section className="space-y-3">
      {/* Deals group (bundles + standalone promotions) */}
      {hasDeals && (
        <DealsGroup
          bundles={bundles}
          promotions={standalonePromotions}
          currency={currency}
          locale={locale}
          durationLabels={durationLabels}
          title={translations?.dealsTitle ?? "Deals"}
        />
      )}

      {/* Section header */}
      {title && <h2 className="text-lg font-semibold">{title}</h2>}

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-muted">{emptyMessage}</p>
        </div>
      )}

      {/* Service groups */}
      {!isEmpty && (
        <div className="space-y-3">
          {groupsWithServices.map((group) => (
            <ServiceGroupCard
              key={group.id}
              group={group}
              promotionMap={servicePromotionMap}
              currency={currency}
              locale={locale}
              durationLabels={durationLabels}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Deals Group (Bundles + Standalone Promotions)
// ============================================================================

interface DealsGroupProps {
  bundles: PublicBundle[];
  promotions: PublicPromotion[];
  currency: string;
  locale: string;
  durationLabels: DurationLabels;
  title: string;
}

function DealsGroup({
  bundles,
  promotions,
  currency,
  locale,
  durationLabels,
  title,
}: DealsGroupProps) {
  if (bundles.length === 0 && promotions.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Group header */}
      <div className="px-4 py-3">
        <span className="font-semibold">{title}</span>
      </div>

      {/* Bundles and promotions as rows */}
      <div className="divide-y divide-border border-t border-border">
        {/* Bundles first */}
        {bundles.map((bundle) => (
          <BundleRow
            key={bundle.id}
            bundle={bundle}
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
          />
        ))}

        {/* Standalone promotions */}
        {promotions.map((promo) => (
          <PromotionRow
            key={promo.id}
            promotion={promo}
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Bundle Row (Inline Style)
// ============================================================================

interface BundleRowProps {
  bundle: PublicBundle;
  currency: string;
  locale: string;
  durationLabels: DurationLabels;
}

function BundleRow({
  bundle,
  currency,
  locale,
  durationLabels,
}: BundleRowProps) {
  const { selectBundle, isBundleSelected } = useServiceSelection();

  const isSelected = isBundleSelected(bundle.id);
  const priceDisplay = formatPrice(bundle.discounted_total_cents, currency, locale);
  const originalPriceDisplay = formatPrice(bundle.original_total_cents, currency, locale);
  const durationDisplay = formatDuration(bundle.total_duration_minutes, durationLabels);

  function handleClick() {
    selectBundle(bundle);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left",
        isSelected ? "bg-accent/10" : "hover:bg-surface-hover",
      )}
    >
      {/* Bundle info */}
      <div className="min-w-0 flex-1">
        {/* Name row with badge */}
        <div className="flex items-center gap-2">
          <span className="font-medium">{bundle.name}</span>
          <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            -{bundle.discount_percentage}%
          </span>
        </div>
        {/* Service names */}
        <p className="mt-0.5 text-xs text-muted">
          {bundle.services.map((s) => s.name).join(" + ")}
        </p>
        {/* Duration and price */}
        <div className="mt-0.5 text-sm text-muted">
          <span>{durationDisplay}</span>
          <span className="mx-1.5">·</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {priceDisplay}
          </span>
          <span className="ml-1.5 line-through">{originalPriceDisplay}</span>
        </div>
      </div>

      {/* Circle checkbox on the right */}
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          isSelected
            ? "border-accent bg-accent text-white"
            : "border-border bg-transparent",
        )}
      >
        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ============================================================================
// Promotion Row (Inline Style for Standalone Promotions)
// ============================================================================

interface PromotionRowProps {
  promotion: PublicPromotion;
  currency: string;
  locale: string;
  durationLabels: DurationLabels;
}

function PromotionRow({
  promotion,
  currency,
  locale,
  durationLabels,
}: PromotionRowProps) {
  const { toggleService, isServiceSelected } = useServiceSelection();

  // Create a ProfileService-like object from the promotion
  const service: ProfileService = {
    id: promotion.service.id,
    name: promotion.service.name,
    price_cents: promotion.discountedPriceCents,
    duration_minutes: promotion.service.durationMinutes,
    display_order: 0,
    available_from_time: null,
    available_to_time: null,
  };

  const isSelected = isServiceSelected(promotion.service.id);
  const priceDisplay = formatPrice(promotion.discountedPriceCents, currency, locale);
  const originalPriceDisplay = formatPrice(promotion.originalPriceCents, currency, locale);
  const durationDisplay = formatDuration(promotion.service.durationMinutes, durationLabels);

  function handleClick() {
    toggleService(service);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left",
        isSelected ? "bg-accent/10" : "hover:bg-surface-hover",
      )}
    >
      {/* Service info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{promotion.service.name}</span>
          <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            -{promotion.discountPercentage}%
          </span>
        </div>
        {/* Duration and price */}
        <div className="mt-0.5 text-sm text-muted">
          <span>{durationDisplay}</span>
          <span className="mx-1.5">·</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {priceDisplay}
          </span>
          <span className="ml-1.5 line-through">{originalPriceDisplay}</span>
        </div>
      </div>

      {/* Circle checkbox on the right */}
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          isSelected
            ? "border-accent bg-accent text-white"
            : "border-border bg-transparent",
        )}
      >
        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ============================================================================
// Service Group Card
// ============================================================================

interface ServiceGroupCardProps {
  group: ProfileServiceGroup;
  promotionMap: Map<string, PublicPromotion>;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

function ServiceGroupCard({
  group,
  promotionMap,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServiceGroupCardProps) {
  if (group.services.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Group header */}
      <div className="px-4 py-3">
        <div className="font-semibold">{group.name}</div>
      </div>

      {/* Services list */}
      <div className="divide-y divide-border border-t border-border">
        {group.services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            promotion={promotionMap.get(service.id)}
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Service Row
// ============================================================================

interface ServiceRowProps {
  service: ProfileService;
  promotion?: PublicPromotion;
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
}

function ServiceRow({
  service,
  promotion,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
}: ServiceRowProps) {
  const { isServiceSelected, toggleService } = useServiceSelection();

  const isSelected = isServiceSelected(service.id);
  const priceDisplay = formatPrice(service.price_cents, currency, locale);
  const durationDisplay = formatDuration(service.duration_minutes, durationLabels);

  // If there's a promotion, show discounted price
  const hasPromotion = !!promotion;
  const discountedPriceDisplay = hasPromotion
    ? formatPrice(promotion.discountedPriceCents, currency, locale)
    : null;

  function handleClick() {
    // When a promotion exists, toggle with discounted price
    if (hasPromotion) {
      toggleService({
        ...service,
        price_cents: promotion.discountedPriceCents,
      });
    } else {
      toggleService(service);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left",
        isSelected ? "bg-accent/10" : "hover:bg-surface-hover",
      )}
    >
      {/* Service info - name on top, duration and price below */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{service.name}</span>
          {hasPromotion && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              -{promotion.discountPercentage}%
            </span>
          )}
        </div>
        {/* Duration and price below name */}
        <div className="mt-0.5 text-sm text-muted">
          {hasPromotion ? (
            <>
              <span>{durationDisplay}</span>
              <span className="mx-1.5">·</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {discountedPriceDisplay}
              </span>
              <span className="ml-1.5 line-through">{priceDisplay}</span>
            </>
          ) : (
            <>
              <span>{durationDisplay}</span>
              <span className="mx-1.5">·</span>
              <span className="font-medium text-foreground">{priceDisplay}</span>
            </>
          )}
        </div>
      </div>

      {/* Circle checkbox on the right */}
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          isSelected
            ? "border-accent bg-accent text-white"
            : "border-border bg-transparent",
        )}
      >
        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </div>
    </button>
  );
}
