"use client";

import { useState } from "react";
import type {
  BeautyPageInfo,
  BeautyPageRatingStats,
} from "@/lib/queries/beauty-page-profile";
import { HeroSection } from "./hero-section";
import { ReviewsDialog } from "./reviews-dialog";

interface WorkingStatus {
  isOpen: boolean;
  statusMessage: string;
}

interface HeroWithReviewsProps {
  info: BeautyPageInfo;
  ratingStats: BeautyPageRatingStats;
  workingStatus?: WorkingStatus;
  /** Whether current user is the owner of this beauty page */
  isOwner?: boolean;
  translations: {
    verified: {
      title: string;
      description: string;
    };
    reviews: string;
    reviewsDialog: {
      title: string;
      basedOnReviews: string;
      noReviewsYet: string;
      anonymous: string;
    };
  };
}

export function HeroWithReviews({
  info,
  ratingStats,
  workingStatus,
  isOwner,
  translations,
}: HeroWithReviewsProps) {
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  return (
    <>
      <HeroSection
        info={info}
        ratingStats={ratingStats}
        workingStatus={workingStatus}
        isOwner={isOwner}
        translations={{
          verified: translations.verified,
          reviews: translations.reviews,
        }}
        onReviewsClick={() => setIsReviewsOpen(true)}
      />

      <ReviewsDialog
        beautyPageId={info.id}
        ratingStats={ratingStats}
        open={isReviewsOpen}
        onOpenChange={setIsReviewsOpen}
        translations={translations.reviewsDialog}
      />
    </>
  );
}
