"use client";

import { useState } from "react";
import type { ProfileSpecialist } from "@/lib/queries/beauty-page-profile";
import { ReviewsDialog } from "./reviews-dialog";
import { SpecialistCard } from "./specialist-card";

interface SpecialistsSectionProps {
  specialists: ProfileSpecialist[];
  title: string;
  serviceCountLabel: string;
  specialistFallback: string;
  bookLabel: string;
  reviewsTranslations: {
    reviewsLabel: string;
    title: string;
    basedOnReviews: string;
    noReviewsYet: string;
    reply: string;
    anonymous: string;
  };
  onBookSpecialist?: (specialist: ProfileSpecialist) => void;
}

export function SpecialistsSection({
  specialists,
  title,
  serviceCountLabel,
  specialistFallback,
  bookLabel,
  reviewsTranslations,
  onBookSpecialist,
}: SpecialistsSectionProps) {
  const [selectedSpecialist, setSelectedSpecialist] =
    useState<ProfileSpecialist | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter to only show active specialists with at least one service
  const activeSpecialists = specialists.filter(
    (s) => s.is_active && s.service_count > 0,
  );

  // Don't render section if no specialists
  if (activeSpecialists.length === 0) {
    return null;
  }

  function handleReviewsClick(specialist: ProfileSpecialist) {
    setSelectedSpecialist(specialist);
    setDialogOpen(true);
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">{title}</h2>

      {/* Vertical layout - stacked cards */}
      <div className="flex flex-col gap-3">
        {activeSpecialists.map((specialist) => (
          <SpecialistCard
            key={specialist.id}
            specialist={specialist}
            serviceCountLabel={serviceCountLabel}
            fallbackName={specialistFallback}
            reviewsLabel={reviewsTranslations.reviewsLabel}
            noReviewsLabel={reviewsTranslations.noReviewsYet}
            bookLabel={bookLabel}
            onReviewsClick={handleReviewsClick}
            onBookClick={onBookSpecialist}
          />
        ))}
      </div>

      <ReviewsDialog
        specialist={selectedSpecialist}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        translations={reviewsTranslations}
      />
    </section>
  );
}
