"use client";

/**
 * Specialist Selection Step
 *
 * Displays a list of specialists who can perform all selected services.
 * Shown only when multiple specialists are available for the selection.
 */

import { Check, ChevronRight } from "lucide-react";
import { Avatar } from "@/lib/ui/avatar";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import { useBooking } from "./booking-context";
import type { AvailableSpecialist } from "./_lib/booking-types";

interface StepSpecialistSelectProps {
  translations: {
    title: string;
    subtitle: string;
  };
  durationLabels: {
    min: string;
    hour: string;
  };
}

export function StepSpecialistSelect({
  translations,
  durationLabels,
}: StepSpecialistSelectProps) {
  const { availableSpecialists, selectSpecialist, currency, locale } =
    useBooking();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {translations.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {translations.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {availableSpecialists.map((specialist) => (
          <SpecialistCard
            key={specialist.memberId}
            specialist={specialist}
            currency={currency}
            locale={locale}
            durationLabels={durationLabels}
            onSelect={() => selectSpecialist(specialist)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Specialist Card
// ============================================================================

interface SpecialistCardProps {
  specialist: AvailableSpecialist;
  currency: string;
  locale: string;
  durationLabels: {
    min: string;
    hour: string;
  };
  onSelect: () => void;
}

function SpecialistCard({
  specialist,
  currency,
  locale,
  durationLabels,
  onSelect,
}: SpecialistCardProps) {
  const formattedPrice = formatPrice(specialist.totalPriceCents, currency, locale);
  const formattedDuration = formatDuration(
    specialist.totalDurationMinutes,
    durationLabels,
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-750"
    >
      <Avatar
        url={specialist.avatarUrl}
        name={specialist.displayName}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {specialist.displayName}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span>{formattedDuration}</span>
          <span className="mx-1.5">•</span>
          <span>{formattedPrice}</span>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
    </button>
  );
}
