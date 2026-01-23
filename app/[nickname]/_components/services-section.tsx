"use client";

/**
 * Services Section with Inline Bundles and Promotions
 *
 * Displays services grouped by category with:
 * - Filter capsules to quickly filter by service group
 * - "Deals" group at the top (bundles + standalone promotions)
 * - Service groups below with inline promotion badges
 *
 * Bundles are first-class bookable entities - selecting a bundle
 * books the entire bundle, not individual services.
 */

import { CalendarDays, Check, Hash, Lock } from "lucide-react";
import { useState } from "react";
import type {
  ProfileService,
  ProfileServiceGroup,
} from "@/lib/queries/beauty-page-profile";
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
    allFilter?: string;
    // Availability badges
    daysRemaining?: string;
    quantityRemaining?: string;
    includedInBundle?: string;
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
  // Filter state: null = "All", otherwise group ID
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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
  // Deduplicate by service ID, keeping only the best promotion per service
  const serviceIdsInGroups = new Set(
    groupsWithServices.flatMap((g) => g.services.map((s) => s.id)),
  );
  const standalonePromotionMap = new Map<string, PublicPromotion>();
  for (const promo of promotions) {
    if (serviceIdsInGroups.has(promo.service.id)) {
      continue; // Skip services that are in groups
    }
    const existing = standalonePromotionMap.get(promo.service.id);
    if (!existing || promo.discountPercentage > existing.discountPercentage) {
      standalonePromotionMap.set(promo.service.id, promo);
    }
  }
  const standalonePromotions = Array.from(standalonePromotionMap.values());

  const hasDeals = bundles.length > 0 || standalonePromotions.length > 0;

  // Filter groups based on selection
  const filteredGroups = selectedGroupId
    ? groupsWithServices.filter((group) => group.id === selectedGroupId)
    : groupsWithServices;

  // Only show filter capsules if there are multiple groups
  const showFilters = groupsWithServices.length > 1;

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
          availabilityLabels={{
            daysRemaining: translations?.daysRemaining ?? "{days} days left",
            quantityRemaining:
              translations?.quantityRemaining ?? "{remaining} of {total} left",
          }}
        />
      )}

      {/* Section header */}
      {title && <h2 className="text-lg font-semibold">{title}</h2>}

      {/* Filter capsules */}
      {showFilters && (
        <FilterCapsules
          groups={groupsWithServices}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          allLabel={translations?.allFilter ?? "All"}
        />
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-muted">{emptyMessage}</p>
        </div>
      )}

      {/* Service groups */}
      {!isEmpty && (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <ServiceGroupCard
              key={group.id}
              group={group}
              promotionMap={servicePromotionMap}
              currency={currency}
              locale={locale}
              durationLabels={durationLabels}
              includedInBundleLabel={translations?.includedInBundle}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Filter Capsules
// ============================================================================

interface FilterCapsulesProps {
  groups: ProfileServiceGroup[];
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  allLabel: string;
}

function FilterCapsules({
  groups,
  selectedGroupId,
  onSelect,
  allLabel,
}: FilterCapsulesProps) {
  return (
    <div
      className="-mx-4"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
      }}
    >
      <div
        className="scrollbar-hide flex gap-2 px-4 pb-1"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* "All" capsule */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            selectedGroupId === null
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface hover:bg-surface-hover",
          )}
        >
          {allLabel}
        </button>

        {/* Group capsules */}
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              selectedGroupId === group.id
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface hover:bg-surface-hover",
            )}
          >
            {group.name}
          </button>
        ))}
      </div>
    </div>
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
  availabilityLabels: {
    daysRemaining: string;
    quantityRemaining: string;
  };
}

function DealsGroup({
  bundles,
  promotions,
  currency,
  locale,
  durationLabels,
  title,
  availabilityLabels,
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
            availabilityLabels={availabilityLabels}
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
  availabilityLabels: {
    daysRemaining: string;
    quantityRemaining: string;
  };
}

function BundleRow({
  bundle,
  currency,
  locale,
  durationLabels,
  availabilityLabels,
}: BundleRowProps) {
  const { selectBundle, isBundleSelected } = useServiceSelection();

  const isSelected = isBundleSelected(bundle.id);
  const priceDisplay = formatPrice(
    bundle.discounted_total_cents,
    currency,
    locale,
  );
  const originalPriceDisplay = formatPrice(
    bundle.original_total_cents,
    currency,
    locale,
  );
  const durationDisplay = formatDuration(
    bundle.total_duration_minutes,
    durationLabels,
  );

  // Calculate availability info
  const hasTimeLimit = bundle.valid_from || bundle.valid_until;
  const hasQuantityLimit = bundle.max_quantity !== null;
  const remainingQuantity =
    hasQuantityLimit && bundle.max_quantity
      ? bundle.max_quantity - bundle.booked_count
      : null;

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
        {/* Name row with badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{bundle.name}</span>
          {/* Discount badge */}
          <span className="inline-flex shrink-0 items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
            {bundle.discount_type === "fixed"
              ? `-${formatPrice(bundle.discount_value, currency, locale)}`
              : `-${bundle.discount_percentage}%`}
          </span>
          {/* Time limit badge */}
          {hasTimeLimit && bundle.availability.daysRemaining !== undefined && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                bundle.availability.daysRemaining <= 3
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {availabilityLabels.daysRemaining.replace(
                "{days}",
                String(bundle.availability.daysRemaining),
              )}
            </span>
          )}
          {/* Quantity limit badge */}
          {hasQuantityLimit && remainingQuantity !== null && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                remainingQuantity <= 3
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
              )}
            >
              <Hash className="h-3 w-3" />
              {availabilityLabels.quantityRemaining
                .replace("{remaining}", String(remainingQuantity))
                .replace("{total}", String(bundle.max_quantity))}
            </span>
          )}
        </div>
        {/* Service names */}
        <p className="mt-0.5 text-xs text-muted">
          {bundle.services.map((s) => s.name).join(" + ")}
        </p>
        {/* Duration and price */}
        <div className="mt-0.5 text-sm text-muted">
          <span>{durationDisplay}</span>
          <span className="mx-1.5">·</span>
          <span className="font-medium text-violet-600 dark:text-violet-400">
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
    description: null,
    price_cents: promotion.discountedPriceCents,
    duration_minutes: promotion.service.durationMinutes,
    display_order: 0,
    available_from_time: null,
    available_to_time: null,
  };

  const isSelected = isServiceSelected(promotion.service.id);
  const priceDisplay = formatPrice(
    promotion.discountedPriceCents,
    currency,
    locale,
  );
  const originalPriceDisplay = formatPrice(
    promotion.originalPriceCents,
    currency,
    locale,
  );
  const durationDisplay = formatDuration(
    promotion.service.durationMinutes,
    durationLabels,
  );

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
          <span className="inline-flex shrink-0 items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
            -{promotion.discountPercentage}%
          </span>
        </div>
        {/* Duration and price */}
        <div className="mt-0.5 text-sm text-muted">
          <span>{durationDisplay}</span>
          <span className="mx-1.5">·</span>
          <span className="font-medium text-violet-600 dark:text-violet-400">
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
  includedInBundleLabel?: string;
}

function ServiceGroupCard({
  group,
  promotionMap,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  includedInBundleLabel,
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
            includedInBundleLabel={includedInBundleLabel}
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
  includedInBundleLabel?: string;
}

function ServiceRow({
  service,
  promotion,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  includedInBundleLabel = "Included in bundle",
}: ServiceRowProps) {
  const { isServiceSelected, toggleService, isServiceBlocked } =
    useServiceSelection();

  const isSelected = isServiceSelected(service.id);
  const isBlocked = isServiceBlocked(service.id);
  const priceDisplay = formatPrice(service.price_cents, currency, locale);
  const durationDisplay = formatDuration(
    service.duration_minutes,
    durationLabels,
  );

  // If there's a promotion, show discounted price
  const hasPromotion = !!promotion;
  const discountedPriceDisplay = hasPromotion
    ? formatPrice(promotion.discountedPriceCents, currency, locale)
    : null;

  function handleClick() {
    // Don't allow clicking if blocked
    if (isBlocked) {
      return;
    }
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
      disabled={isBlocked}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left",
        isBlocked
          ? "cursor-not-allowed opacity-50"
          : isSelected
            ? "bg-accent/10"
            : "hover:bg-surface-hover",
      )}
    >
      {/* Service info - name on top, duration and price below */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{service.name}</span>
          {hasPromotion && !isBlocked && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              -{promotion.discountPercentage}%
            </span>
          )}
          {isBlocked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/20 px-1.5 py-0.5 text-xs font-medium text-muted">
              <Lock className="h-3 w-3" />
              {includedInBundleLabel}
            </span>
          )}
        </div>
        {/* Optional description */}
        {service.description && (
          <p className="mt-0.5 text-sm text-muted">{service.description}</p>
        )}
        {/* Duration and price below name */}
        <div className="mt-0.5 text-sm text-muted">
          {hasPromotion && !isBlocked ? (
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
              <span className={cn("font-medium", !isBlocked && "text-foreground")}>
                {priceDisplay}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Circle checkbox on the right */}
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          isBlocked
            ? "border-muted/30 bg-muted/10"
            : isSelected
              ? "border-accent bg-accent text-white"
              : "border-border bg-transparent",
        )}
      >
        {isSelected && !isBlocked && (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        )}
        {isBlocked && <Lock className="h-3 w-3 text-muted" />}
      </div>
    </button>
  );
}
