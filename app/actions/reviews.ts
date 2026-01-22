"use server";

import {
  type BeautyPageReview,
  getBeautyPageReviews,
} from "@/lib/queries/reviews";

/**
 * Fetches reviews for a beauty page.
 * Server action wrapper for client components.
 */
export async function fetchBeautyPageReviewsAction(
  beautyPageId: string,
): Promise<BeautyPageReview[]> {
  return getBeautyPageReviews(beautyPageId);
}
