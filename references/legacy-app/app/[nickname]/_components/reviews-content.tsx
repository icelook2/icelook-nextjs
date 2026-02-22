"use client";

/**
 * Reviews Content - Inline reviews display for tab panel
 *
 * Displays reviews directly in the page (not in a dialog).
 * Lazily fetches reviews when first rendered.
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchBeautyPageReviewsAction } from "@/app/actions/reviews";
import type { BeautyPageReview } from "@/lib/queries/reviews";
import { StarRating } from "@/lib/ui/star-rating";

// ============================================================================
// Types
// ============================================================================

interface RatingStats {
  averageRating: number;
  totalReviews: number;
}

interface ReviewsContentProps {
  beautyPageId: string;
  ratingStats: RatingStats;
  translations: {
    basedOnReviews: string;
    noReviewsYet: string;
    anonymous: string;
  };
}

// ============================================================================
// Review Card
// ============================================================================

function ReviewCard({
  review,
  anonymousLabel,
}: {
  review: BeautyPageReview;
  anonymousLabel: string;
}) {
  const reviewerName = review.reviewer.full_name || anonymousLabel;
  const initial = reviewerName.charAt(0).toUpperCase();

  // Format date
  const date = new Date(review.created_at);
  const formattedDate = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {review.reviewer.avatar_url ? (
          <Image
            src={review.reviewer.avatar_url}
            alt={reviewerName}
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent">
            {initial}
          </div>
        )}

        {/* Name, date, rating */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{reviewerName}</span>
            <span className="text-xs text-muted">{formattedDate}</span>
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      {/* Comment */}
      {review.comment && <p className="text-sm text-muted">{review.comment}</p>}
    </div>
  );
}

// ============================================================================
// Reviews Content
// ============================================================================

export function ReviewsContent({
  beautyPageId,
  ratingStats,
  translations,
}: ReviewsContentProps) {
  const [reviews, setReviews] = useState<BeautyPageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch reviews on mount
  useEffect(() => {
    if (hasFetched || !beautyPageId) {
      return;
    }

    async function fetchReviews() {
      setIsLoading(true);
      try {
        const data = await fetchBeautyPageReviewsAction(beautyPageId);
        setReviews(data);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
        setHasFetched(true);
      }
    }

    fetchReviews();
  }, [beautyPageId, hasFetched]);

  return (
    <div className="space-y-4">
      {/* Rating summary */}
      {ratingStats.totalReviews > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <StarRating rating={ratingStats.averageRating} size="md" />
            <span className="font-semibold">
              {ratingStats.averageRating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-muted">
            {translations.basedOnReviews}
          </span>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="py-8 text-center text-muted">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-muted">{translations.noReviewsYet}</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {reviews.map((review) => (
            <div key={review.id} className="p-4">
              <ReviewCard
                review={review}
                anonymousLabel={translations.anonymous}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
