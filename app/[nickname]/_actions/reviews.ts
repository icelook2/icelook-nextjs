"use server";

import { getSpecialistReviews, type Review } from "@/lib/queries/reviews";

/**
 * Server action to fetch reviews for a specialist.
 * This action is called from client components to fetch reviews.
 */
export async function fetchSpecialistReviews(
  specialistId: string,
): Promise<Review[]> {
  return getSpecialistReviews(specialistId);
}
