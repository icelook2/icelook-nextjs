"use client";

/**
 * Booking Bar
 *
 * A floating bar that appears at the bottom of the screen when services are selected.
 * Shows selection summary and provides actions to proceed with booking or clear selection.
 *
 * Rendered via Portal to document.body to ensure proper stacking without z-index.
 */

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
  /** Button text when specialist selection needed */
  selectSpecialist: string;
  /** Button text when ready to book */
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
// Component
// ============================================================================

export function BookingBar({
  currency,
  locale,
  durationLabels,
  translations,
  onBookClick,
}: BookingBarProps) {
  const [mounted, setMounted] = useState(false);
  const {
    selectedServices,
    autoSelectedSpecialist,
    totalPriceRange,
    totalDurationRange,
    clearSelection,
  } = useServiceSelection();

  // Only render portal on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const hasSelection = selectedServices.length > 0;

  // Format service count text
  const serviceCountText =
    selectedServices.length === 1
      ? translations.serviceSelected
      : translations.servicesSelected.replace(
          "{count}",
          String(selectedServices.length),
        );

  // Format price text
  const priceText =
    totalPriceRange.min === totalPriceRange.max
      ? formatPrice(totalPriceRange.min, currency, locale)
      : `${formatPrice(totalPriceRange.min, currency, locale)} – ${formatPrice(totalPriceRange.max, currency, locale)}`;

  // Format duration text
  const durationText =
    totalDurationRange.min === totalDurationRange.max
      ? formatDuration(totalDurationRange.min, durationLabels)
      : `${formatDuration(totalDurationRange.min, durationLabels)} – ${formatDuration(totalDurationRange.max, durationLabels)}`;

  // Button text depends on whether specialist is auto-selected
  const buttonText = autoSelectedSpecialist
    ? translations.bookNow
    : translations.selectSpecialist;

  // Don't render on server
  if (!mounted) {
    return null;
  }

  const barContent = (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3 py-3">
            {/* Clear button */}
            <button
              type="button"
              onClick={clearSelection}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-hover"
              aria-label={translations.clearSelection}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Summary */}
            <div className="min-w-0 flex-1">
              <div className="font-medium">{serviceCountText}</div>
              <div className="text-sm text-muted">
                {durationText} · {priceText}
              </div>
            </div>

            {/* Book button */}
            <Button onClick={onBookClick}>{buttonText}</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render to document.body via Portal for proper stacking
  return createPortal(barContent, document.body);
}
