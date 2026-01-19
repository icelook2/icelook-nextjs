"use client";

/**
 * Booking Bar (Solo Creator Model)
 *
 * A bar that appears when services are selected.
 * Shows selection summary and provides actions to proceed with booking or clear selection.
 *
 * Responsive design:
 * - Mobile (< sm): Fixed bar at bottom (replaces bottom nav)
 * - Desktop (sm+): Portal-based side drawer on the right
 *
 * On mobile, this bar is rendered by BookingBarWrapper when services are selected,
 * replacing the BottomNav. User can click X to clear selection and return to nav.
 */

import { Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/lib/ui/button";
import {
  type DurationLabels,
  formatDuration,
  formatPrice,
} from "@/lib/utils/price-range";
import { useServiceSelection } from "./service-selection-context";

// ============================================================================
// Types
// ============================================================================

export interface BookingBarTranslations {
  /** Singular: "1 service" */
  serviceSelected: string;
  /** Plural with count placeholder: "{count} services" */
  servicesSelected: string;
  /** Button text */
  bookNow: string;
  /** Clear selection button aria-label */
  clearSelection: string;
}

interface BookingBarProps {
  currency: string;
  locale: string;
  durationLabels: DurationLabels;
  translations: BookingBarTranslations;
  onBookClick: () => void;
}

// ============================================================================
// Helper
// ============================================================================

function formatServiceCount(
  count: number,
  translations: { serviceSelected: string; servicesSelected: string }
): string {
  return count === 1
    ? translations.serviceSelected
    : translations.servicesSelected.replace("{count}", String(count));
}

// ============================================================================
// Mobile Sticky Bar Component
// ============================================================================

interface MobileStickyBarProps {
  serviceCount: number;
  totalPriceCents: number;
  currency: string;
  locale: string;
  translations: BookingBarTranslations;
  onBookClick: () => void;
  onClearSelection: () => void;
}

function MobileStickyBar({
  serviceCount,
  totalPriceCents,
  currency,
  locale,
  translations,
  onBookClick,
  onClearSelection,
}: MobileStickyBarProps) {
  return createPortal(
    <div
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface sm:hidden"
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <button
          type="button"
          onClick={onClearSelection}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-surface-hover"
          aria-label={translations.clearSelection}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">{serviceCount} </span>
          <span className="text-sm text-muted">· {formatPrice(totalPriceCents, currency, locale)}</span>
        </div>
        <Button size="sm" onClick={onBookClick}>
          {translations.bookNow}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

// ============================================================================
// Desktop Side Drawer Component (rendered via portal)
// ============================================================================

interface DesktopSideDrawerProps {
  serviceCount: number;
  totalPriceCents: number;
  totalDurationMinutes: number;
  currency: string;
  locale: string;
  durationLabels: DurationLabels;
  translations: BookingBarTranslations;
  onBookClick: () => void;
  onClearSelection: () => void;
}

function DesktopSideDrawer({
  serviceCount,
  totalPriceCents,
  totalDurationMinutes,
  currency,
  locale,
  durationLabels,
  translations,
  onBookClick,
  onClearSelection,
}: DesktopSideDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const content = (
    <div className="fixed bottom-4 right-4 hidden w-64 rounded-2xl border border-border bg-surface p-4 shadow-xl sm:block">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{formatServiceCount(serviceCount, translations)}</span>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-full p-1 hover:bg-surface-hover"
            aria-label={translations.clearSelection}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatDuration(totalDurationMinutes, durationLabels)}
          </div>
          <div className="font-medium text-foreground">
            {formatPrice(totalPriceCents, currency, locale)}
          </div>
        </div>
        <Button className="w-full" onClick={onBookClick}>
          {translations.bookNow}
        </Button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ============================================================================
// Main Component
// ============================================================================

export function BookingBar({
  currency,
  locale,
  durationLabels,
  translations,
  onBookClick,
}: BookingBarProps) {
  const {
    selectedServices,
    totalPriceCents,
    totalDurationMinutes,
    clearSelection,
  } = useServiceSelection();

  const hasSelection = selectedServices.length > 0;

  if (!hasSelection) {
    return null;
  }

  const serviceCount = selectedServices.length;

  return (
    <>
      {/* Mobile: Fixed bottom bar (replaces bottom nav in focus mode) */}
      <MobileStickyBar
        serviceCount={serviceCount}
        totalPriceCents={totalPriceCents}
        currency={currency}
        locale={locale}
        translations={translations}
        onBookClick={onBookClick}
        onClearSelection={clearSelection}
      />

      {/* Desktop: Fixed side drawer (via portal) */}
      <DesktopSideDrawer
        serviceCount={serviceCount}
        totalPriceCents={totalPriceCents}
        totalDurationMinutes={totalDurationMinutes}
        currency={currency}
        locale={locale}
        durationLabels={durationLabels}
        translations={translations}
        onBookClick={onBookClick}
        onClearSelection={clearSelection}
      />
    </>
  );
}
