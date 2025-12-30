"use client";

/**
 * Specialists Column
 *
 * Displays specialists in the horizontal booking layout.
 * Uses BookingLayoutContext for selection and availability.
 *
 * Behavior:
 * - Available specialists (can do all selected services AND work on selected date)
 *   appear at the top, sorted by price
 * - Unavailable specialists are grayed and appear below
 * - Shows price for selected services when services are selected
 * - Supports date-first flow: specialists who don't work on selected date are grayed
 */

import { useMemo } from "react";
import type { DurationLabels } from "@/lib/utils/price-range";
import { useBookingLayout, type SpecialistWithPrice } from "./booking-layout-context";
import { SpecialistBookingCard } from "./specialist-booking-card";

// ============================================================================
// Types
// ============================================================================

interface SpecialistsColumnProps {
  title: string;
  fallbackName: string;
  currency?: string;
  locale?: string;
  durationLabels?: DurationLabels;
}

// ============================================================================
// Component
// ============================================================================

export function SpecialistsColumn({
  title,
  fallbackName,
  currency = "UAH",
  locale = "uk-UA",
  durationLabels = { min: "min", hour: "h" },
}: SpecialistsColumnProps) {
  const {
    specialistsWithPrices,
    selectedSpecialistId,
    selectedServiceIds,
    selectSpecialist,
    isSpecialistWorkingOnDate,
    isSpecialistAvailableAtTime,
  } = useBookingLayout();

  const hasSelectedServices = selectedServiceIds.size > 0;

  // Partition and sort specialists
  // A specialist is "available" if:
  // 1. They can do ALL selected services (or no services selected)
  // 2. They work on the selected date (or no date selected)
  // 3. They are available at the selected time (or no time selected)
  const sortedSpecialists = useMemo(() => {
    const available: SpecialistWithPrice[] = [];
    const unavailable: SpecialistWithPrice[] = [];

    for (const specialist of specialistsWithPrices) {
      // Filter to only active specialists with services
      if (!specialist.is_active || specialist.service_count === 0) {
        continue;
      }

      const canDoServices = specialist.isAvailable; // Can do all selected services
      const worksOnDate = isSpecialistWorkingOnDate(specialist.member_id);
      const availableAtTime = isSpecialistAvailableAtTime(specialist.member_id);
      const isFullyAvailable = canDoServices && worksOnDate && availableAtTime;

      if (isFullyAvailable) {
        available.push(specialist);
      } else {
        unavailable.push(specialist);
      }
    }

    // Sort available by lowest price first (only when services selected)
    if (hasSelectedServices) {
      available.sort((a, b) => a.totalPriceCents - b.totalPriceCents);
    }

    // Available first, then unavailable (grayed)
    return [...available, ...unavailable];
  }, [specialistsWithPrices, hasSelectedServices, isSpecialistWorkingOnDate, isSpecialistAvailableAtTime]);

  // Handle specialist selection
  const handleSpecialistClick = (specialistId: string) => {
    if (selectedSpecialistId === specialistId) {
      // Deselect if already selected
      selectSpecialist(null);
    } else {
      selectSpecialist(specialistId);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="pb-3">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {sortedSpecialists.map((specialist) => {
          const worksOnDate = isSpecialistWorkingOnDate(specialist.member_id);
          const availableAtTime = isSpecialistAvailableAtTime(specialist.member_id);
          const isFullyAvailable = specialist.isAvailable && worksOnDate && availableAtTime;

          return (
            <SpecialistBookingCard
              key={specialist.id}
              specialist={specialist}
              priceCents={specialist.totalPriceCents}
              durationMinutes={specialist.totalDurationMinutes}
              isSelected={selectedSpecialistId === specialist.member_id}
              isAvailable={isFullyAvailable}
              hasSelectedServices={hasSelectedServices}
              onClick={() => handleSpecialistClick(specialist.member_id)}
              fallbackName={fallbackName}
              currency={currency}
              locale={locale}
              durationLabels={durationLabels}
            />
          );
        })}

        {/* Empty state */}
        {sortedSpecialists.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">No specialists available</p>
          </div>
        )}
      </div>
    </div>
  );
}
