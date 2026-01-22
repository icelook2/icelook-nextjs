"use client";

import { useLocale, useTranslations } from "next-intl";
import { Paper } from "@/lib/ui/paper";
import { StarRating } from "@/lib/ui/star-rating";
import type { AppointmentReview } from "../../_actions/review.actions";

// ============================================================================
// Types
// ============================================================================

interface AppointmentReviewCardProps {
  review: AppointmentReview;
}

// ============================================================================
// Component
// ============================================================================

export function AppointmentReviewCard({ review }: AppointmentReviewCardProps) {
  const t = useTranslations("appointments");
  const locale = useLocale();

  // Format review date
  const reviewDate = new Date(review.created_at);
  const formattedDate = reviewDate.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Paper className="p-4">
      <div className="space-y-3">
        {/* Header with title and date */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("your_review")}
          </p>
          <span className="text-xs text-muted">{formattedDate}</span>
        </div>

        {/* Rating */}
        <StarRating rating={review.rating} size="md" showValue />

        {/* Comment */}
        {review.comment && (
          <p className="text-sm text-foreground">{review.comment}</p>
        )}

        {/* Creator reply */}
        {review.reply && (
          <div className="mt-4 rounded-xl bg-surface-alt p-3">
            <p className="mb-1 text-xs font-medium text-muted">
              {t("creator_reply")}
            </p>
            <p className="text-sm text-foreground">{review.reply.content}</p>
          </div>
        )}
      </div>
    </Paper>
  );
}
