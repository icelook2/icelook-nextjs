"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { ProfileSpecialist } from "@/lib/queries/beauty-page-profile";
import type { Review } from "@/lib/queries/reviews";
import { Avatar } from "@/lib/ui/avatar";
import { Dialog } from "@/lib/ui/dialog";
import { StarRating } from "@/lib/ui/star-rating";
import { formatDistanceToNow } from "@/lib/utils/date";
import { fetchSpecialistReviews } from "../_actions/reviews";

interface ReviewsDialogProps {
  specialist: ProfileSpecialist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translations: {
    title: string;
    basedOnReviews: string;
    noReviewsYet: string;
    reply: string;
    anonymous: string;
  };
}

export function ReviewsDialog({
  specialist,
  open,
  onOpenChange,
  translations,
}: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && specialist) {
      setLoading(true);
      fetchSpecialistReviews(specialist.id)
        .then(setReviews)
        .finally(() => setLoading(false));
    }
  }, [open, specialist]);

  if (!specialist) {
    return null;
  }

  const displayName =
    specialist.display_name || specialist.full_name || translations.anonymous;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="lg">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          {translations.title.replace("{name}", displayName)}
        </Dialog.Header>

        <Dialog.Body className="max-h-[60vh] space-y-6 overflow-y-auto">
          {/* Rating summary */}
          <div className="flex items-center gap-4 rounded-xl bg-surface-alt p-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {specialist.average_rating.toFixed(1)}
              </div>
              <StarRating rating={specialist.average_rating} size="sm" />
            </div>
            <div className="text-sm text-muted">
              {translations.basedOnReviews.replace(
                "{count}",
                String(specialist.total_reviews),
              )}
            </div>
          </div>

          {/* Reviews list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-muted">
              {translations.noReviewsYet}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  replyLabel={translations.reply}
                  anonymousLabel={translations.anonymous}
                />
              ))}
            </div>
          )}
        </Dialog.Body>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ReviewItemProps {
  review: Review;
  replyLabel: string;
  anonymousLabel: string;
}

function ReviewItem({ review, replyLabel, anonymousLabel }: ReviewItemProps) {
  const reviewerName = review.reviewer.full_name || anonymousLabel;

  return (
    <div className="rounded-xl border border-border p-4">
      {/* Reviewer info and rating */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            url={review.reviewer.avatar_url}
            name={reviewerName}
            size="sm"
          />
          <div>
            <div className="font-medium">{reviewerName}</div>
            <div className="text-xs text-muted">
              {formatDistanceToNow(new Date(review.created_at))}
            </div>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed">{review.comment}</p>
      )}

      {/* Reply from specialist */}
      {review.reply && (
        <div className="mt-3 rounded-lg bg-surface-alt p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
            <MessageCircle className="size-3" />
            {replyLabel}
          </div>
          <p className="text-sm leading-relaxed">{review.reply.content}</p>
        </div>
      )}
    </div>
  );
}
