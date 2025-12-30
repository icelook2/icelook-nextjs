"use client";

/**
 * Specialist Selection Step
 *
 * Displays a list of specialists who can perform all selected services.
 * Shown only when multiple specialists are available for the selection.
 */

import { ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatPrice } from "@/lib/utils/price-range";
import { useBooking } from "./booking-context";
import type { AvailableSpecialist } from "./_lib/booking-types";

interface StepSpecialistSelectProps {
  translations: {
    title: string;
    subtitle: string;
    nextButton: string;
  };
  cancelLabel: string;
  durationLabels: {
    min: string;
    hour: string;
  };
  onCancel: () => void;
}

export function StepSpecialistSelect({
  translations,
  cancelLabel,
  durationLabels,
  onCancel,
}: StepSpecialistSelectProps) {
  const { availableSpecialists, selectSpecialist, currency, locale } =
    useBooking();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSpecialist = availableSpecialists.find(
    (s) => s.memberId === selectedId,
  );

  const handleNext = useCallback(() => {
    if (selectedSpecialist) {
      selectSpecialist(selectedSpecialist);
    }
  }, [selectedSpecialist, selectSpecialist]);

  return (
    <div className="flex flex-col">
      {/* Content */}
      <div className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          {availableSpecialists.map((specialist) => (
            <SpecialistCard
              key={specialist.memberId}
              specialist={specialist}
              currency={currency}
              locale={locale}
              durationLabels={durationLabels}
              isSelected={selectedId === specialist.memberId}
              onSelect={() => setSelectedId(specialist.memberId)}
            />
          ))}
        </div>
      </div>

      {/* Footer with actions */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={handleNext} disabled={!selectedSpecialist}>
          {translations.nextButton}
        </Button>
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
  isSelected: boolean;
  onSelect: () => void;
}

function SpecialistCard({
  specialist,
  currency,
  locale,
  durationLabels,
  isSelected,
  onSelect,
}: SpecialistCardProps) {
  const formattedPrice = formatPrice(
    specialist.totalPriceCents,
    currency,
    locale,
  );
  const formattedDuration = formatDuration(
    specialist.totalDurationMinutes,
    durationLabels,
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-xl p-3 text-left transition-all",
        isSelected
          ? "bg-primary/10 ring-2 ring-primary"
          : "bg-surface-secondary hover:bg-surface-hover",
      )}
    >
      <Avatar
        url={specialist.avatarUrl}
        name={specialist.displayName}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground">
          {specialist.displayName}
        </div>
        <div className="text-sm text-muted">
          <span>{formattedDuration}</span>
          <span className="mx-1.5">•</span>
          <span>{formattedPrice}</span>
        </div>
      </div>

      <ChevronRight
        className={cn(
          "h-5 w-5 transition-transform",
          isSelected ? "text-primary" : "text-muted",
        )}
      />
    </button>
  );
}
