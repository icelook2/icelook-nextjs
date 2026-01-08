"use client";

/**
 * Booking Summary Bar (Solo Creator Model)
 *
 * Fixed bottom bar that shows booking progress on mobile.
 * Displays price/duration summary and a button to proceed to booking.
 * Uses Portal to render at document.body level for proper stacking.
 *
 * Key change from multi-specialist model:
 * - No specialist display - price comes from selected services
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/lib/ui/button";
import {
  type DurationLabels,
  formatDuration,
  formatPrice,
} from "@/lib/utils/price-range";
import { useBookingLayout } from "./booking-layout-context";

// ============================================================================
// Types
// ============================================================================

interface BookingSummaryBarProps {
  currency?: string;
  locale?: string;
  durationLabels: DurationLabels;
  onBookClick: () => void;
  bookLabel: string;
}

// ============================================================================
// Component
// ============================================================================

export function BookingSummaryBar({
  currency = "UAH",
  locale = "uk-UA",
  durationLabels,
  onBookClick,
  bookLabel,
}: BookingSummaryBarProps) {
  const {
    selectedServiceIds,
    selectedDate,
    selectedTime,
    selectedServices,
    totalPriceCents,
    totalDurationMinutes,
  } = useBookingLayout();

  // Portal mounting state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Check if we have any selections to show
  const hasSelections = selectedServiceIds.size > 0;

  // Format duration
  const formattedDuration =
    totalDurationMinutes > 0
      ? formatDuration(totalDurationMinutes, durationLabels)
      : null;

  // Don't render if not mounted or no selections
  if (!mounted || !hasSelections) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
      >
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Summary */}
            <div className="min-w-0 flex-1">
              {/* Services count */}
              <div className="text-sm text-muted">
                {selectedServices.length} service
                {selectedServices.length !== 1 ? "s" : ""} selected
              </div>

              {/* Date/time info */}
              {selectedDate && selectedTime && (
                <div className="mt-0.5 text-sm text-muted">
                  {selectedDate.toLocaleDateString(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  @ {selectedTime}
                </div>
              )}
            </div>

            {/* Right: Price and button */}
            <div className="flex items-center gap-3">
              {/* Price and duration */}
              {totalPriceCents > 0 && (
                <div className="text-right">
                  <div className="text-lg font-semibold text-accent">
                    {formatPrice(totalPriceCents, currency, locale)}
                  </div>
                  {formattedDuration && (
                    <div className="text-xs text-muted">
                      {formattedDuration}
                    </div>
                  )}
                </div>
              )}

              {/* Book button */}
              <Button onClick={onBookClick} size="lg">
                {bookLabel}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
