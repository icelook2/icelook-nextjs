"use client";

/**
 * Booking Summary Bar
 *
 * Fixed bottom bar that shows booking progress on mobile.
 * Displays price/duration summary and a button to proceed to booking.
 * Uses Portal to render at document.body level for proper stacking.
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
    selectedSpecialistId,
    selectedDate,
    selectedTime,
    getSpecialistPrice,
    getSpecialistDuration,
    selectedServices,
    allSpecialists,
  } = useBookingLayout();

  // Portal mounting state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Check if we have any selections to show
  const hasSelections = selectedServiceIds.size > 0;

  // Get price and duration for the selected specialist
  const price = selectedSpecialistId
    ? getSpecialistPrice(selectedSpecialistId)
    : 0;
  const duration = selectedSpecialistId
    ? getSpecialistDuration(selectedSpecialistId)
    : 0;

  // Get specialist name
  const specialistName = selectedSpecialistId
    ? (allSpecialists.find((s) => s.member_id === selectedSpecialistId)
        ?.display_name ?? null)
    : null;

  // Format duration
  const formattedDuration =
    duration > 0 ? formatDuration(duration, durationLabels) : null;

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

              {/* Specialist and date/time info */}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {specialistName && (
                  <span className="font-medium">{specialistName}</span>
                )}
                {selectedDate && selectedTime && (
                  <span className="text-muted">
                    {selectedDate.toLocaleDateString(locale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    @ {selectedTime}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Price and button */}
            <div className="flex items-center gap-3">
              {/* Price and duration */}
              {price > 0 && (
                <div className="text-right">
                  <div className="text-lg font-semibold text-accent">
                    {formatPrice(price, currency, locale)}
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
