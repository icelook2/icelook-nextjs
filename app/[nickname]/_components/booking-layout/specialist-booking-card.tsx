"use client";

/**
 * Specialist Booking Card
 *
 * Simplified specialist card for the horizontal booking layout.
 * Shows avatar, name, price for selected services, and selection state.
 * Supports available/unavailable visual states.
 */

import { Check, Star } from "lucide-react";
import type { ProfileSpecialist } from "@/lib/queries/beauty-page-profile";
import { Avatar } from "@/lib/ui/avatar";
import { LabelBadge } from "@/lib/ui/label-badge";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/price-range";

// ============================================================================
// Types
// ============================================================================

interface SpecialistBookingCardProps {
  specialist: ProfileSpecialist;
  /** Total price for selected services (in cents) */
  priceCents: number;
  /** Total duration for selected services (in minutes) */
  durationMinutes: number;
  /** Whether this specialist is selected */
  isSelected: boolean;
  /** Whether this specialist can do all selected services */
  isAvailable: boolean;
  /** Whether any services are selected (to show price) */
  hasSelectedServices: boolean;
  /** Callback when card is clicked */
  onClick: () => void;
  /** Fallback name if no name is available */
  fallbackName: string;
  /** Currency for price formatting */
  currency?: string;
  /** Locale for price formatting */
  locale?: string;
  /** Duration labels */
  durationLabels?: {
    min: string;
    hour: string;
  };
}

// ============================================================================
// Component
// ============================================================================

export function SpecialistBookingCard({
  specialist,
  priceCents,
  durationMinutes,
  isSelected,
  isAvailable,
  hasSelectedServices,
  onClick,
  fallbackName,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels = { min: "min", hour: "h" },
}: SpecialistBookingCardProps) {
  const displayName =
    specialist.display_name || specialist.full_name || fallbackName;
  const hasReviews = specialist.total_reviews > 0;

  // Format duration
  const formattedDuration = formatDuration(durationMinutes, durationLabels);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAvailable}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-all",
        // Base styles
        "bg-surface",
        // Selected state
        isSelected && "ring-2 ring-accent",
        // Available vs unavailable
        isAvailable
          ? "cursor-pointer hover:bg-surface-hover"
          : "cursor-not-allowed opacity-50",
      )}
    >
      {/* Avatar with selection indicator */}
      <div className="relative">
        <Avatar url={specialist.avatar_url} name={displayName} size="md" />
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Name row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-foreground">{displayName}</span>
          {specialist.labels.slice(0, 2).map((label) => (
            <LabelBadge
              key={label.id}
              name={label.name}
              color={label.color}
              size="sm"
            />
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm">
          <Star
            className={cn(
              "h-3.5 w-3.5",
              hasReviews
                ? "fill-amber-400 text-amber-400"
                : "fill-muted/30 text-muted/30",
            )}
          />
          {hasReviews ? (
            <>
              <span className="font-medium text-foreground">
                {specialist.average_rating.toFixed(1)}
              </span>
              <span className="text-muted">({specialist.total_reviews})</span>
            </>
          ) : (
            <span className="text-muted">-</span>
          )}
        </div>

        {/* Price and duration (only show when services selected) */}
        {hasSelectedServices && isAvailable && (
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-semibold text-accent">
              {formatPrice(priceCents, currency, locale)}
            </span>
            <span className="text-muted">{formattedDuration}</span>
          </div>
        )}

        {/* Unavailable indicator */}
        {!isAvailable && hasSelectedServices && (
          <div className="mt-1 text-xs text-muted">
            Cannot do selected services
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(
  minutes: number,
  labels: { min: string; hour: string },
): string {
  if (minutes < 60) {
    return `${minutes} ${labels.min}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${labels.hour}`;
  }

  return `${hours} ${labels.hour} ${remainingMinutes} ${labels.min}`;
}
