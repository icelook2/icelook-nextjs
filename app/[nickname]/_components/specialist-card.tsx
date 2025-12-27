"use client";

import { Star } from "lucide-react";
import type { ProfileSpecialist } from "@/lib/queries/beauty-page-profile";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { LabelBadge } from "@/lib/ui/label-badge";
import { cn } from "@/lib/utils/cn";

interface SpecialistCardProps {
  specialist: ProfileSpecialist;
  serviceCountLabel: string;
  fallbackName: string;
  reviewsLabel: string;
  noReviewsLabel: string;
  bookLabel: string;
  onReviewsClick?: (specialist: ProfileSpecialist) => void;
  onBookClick?: (specialist: ProfileSpecialist) => void;
}

export function SpecialistCard({
  specialist,
  serviceCountLabel,
  fallbackName,
  reviewsLabel,
  noReviewsLabel,
  bookLabel,
  onReviewsClick,
  onBookClick,
}: SpecialistCardProps) {
  const displayName =
    specialist.display_name || specialist.full_name || fallbackName;

  const hasReviews = specialist.total_reviews > 0;

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-surface p-4">
      {/* Avatar */}
      <Avatar url={specialist.avatar_url} name={displayName} size="lg" />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Name and Labels row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{displayName}</span>
          {specialist.labels.map((label) => (
            <LabelBadge
              key={label.id}
              name={label.name}
              color={label.color}
              size="sm"
            />
          ))}
        </div>

        {/* Service count */}
        <div className="text-sm text-muted">
          {serviceCountLabel.replace(
            "{count}",
            String(specialist.service_count),
          )}
        </div>

        {/* Rating section */}
        <button
          type="button"
          onClick={() => hasReviews && onReviewsClick?.(specialist)}
          className={cn(
            "flex items-center gap-1 text-sm",
            hasReviews && "cursor-pointer transition-opacity hover:opacity-70",
            !hasReviews && "cursor-default",
          )}
          aria-label={reviewsLabel}
          disabled={!hasReviews}
        >
          <Star
            className={cn(
              "size-4",
              hasReviews
                ? "fill-amber-400 text-amber-400"
                : "fill-muted/30 text-muted/30",
            )}
          />
          {hasReviews ? (
            <>
              <span className="font-medium">
                {specialist.average_rating.toFixed(1)}
              </span>
              <span className="text-muted">({specialist.total_reviews})</span>
            </>
          ) : (
            <span className="text-muted">{noReviewsLabel}</span>
          )}
        </button>
      </div>

      {/* Book button */}
      <Button
        variant="primary"
        size="sm"
        onClick={() => onBookClick?.(specialist)}
        className="shrink-0 self-center"
      >
        {bookLabel}
      </Button>
    </div>
  );
}
