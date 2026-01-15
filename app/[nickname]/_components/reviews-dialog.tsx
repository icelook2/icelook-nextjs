"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { BeautyPageReview } from "@/lib/queries/reviews";
import { Dialog } from "@/lib/ui/dialog";
import { StarRating } from "@/lib/ui/star-rating";

// ============================================================================
// Types
// ============================================================================

interface RatingStats {
  averageRating: number;
  totalReviews: number;
}

interface ReviewsDialogProps {
  beautyPageId: string;
  ratingStats: RatingStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translations: {
    title: string;
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
// Reviews Dialog
// ============================================================================

export function ReviewsDialog({
  beautyPageId,
  ratingStats,
  open,
  onOpenChange,
  translations,
}: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<BeautyPageReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reviews when dialog opens
  useEffect(() => {
    if (!open || !beautyPageId) {
      return;
    }

    async function fetchReviews() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/reviews?beautyPageId=${beautyPageId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [open, beautyPageId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="md">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {translations.title} ({ratingStats.totalReviews})
        </Dialog.Header>

        <Dialog.Body className="max-h-[60vh] overflow-y-auto p-4">
          {/* Reviews list */}
          {isLoading ? (
            <div className="py-8 text-center text-muted">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-muted">
              {translations.noReviewsYet}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reviews.map((review) => (
                <div key={review.id} className="py-4 first:pt-0 last:pb-0">
                  <ReviewCard
                    review={review}
                    anonymousLabel={translations.anonymous}
                  />
                </div>
              ))}
            </div>
          )}
        </Dialog.Body>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
