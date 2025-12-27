/**
 * Query functions for specialist reviews.
 */

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

/** Reviewer info from the profiles table */
export type ReviewerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

/** A single review with reviewer info */
export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: ReviewerProfile;
  reply: ReviewReply | null;
};

/** A reply to a review from the specialist */
export type ReviewReply = {
  id: string;
  content: string;
  created_at: string;
};

/** Rating statistics for a specialist */
export type RatingStats = {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
};

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetches all reviews for a specialist with reviewer info and replies.
 *
 * @param specialistId - The specialist ID (beauty_page_specialists.id)
 * @returns Array of reviews sorted by newest first
 */
export async function getSpecialistReviews(
  specialistId: string,
): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      profiles!reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      review_replies (
        id,
        content,
        created_at
      )
    `)
    .eq("specialist_id", specialistId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((review) => {
    const profile = review.profiles as unknown as ReviewerProfile | null;
    const replies = review.review_replies as unknown as ReviewReply[] | null;

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer: {
        id: profile?.id ?? "",
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      reply: replies?.[0] ?? null,
    };
  });
}

/**
 * Fetches rating statistics for a specialist using the database function.
 *
 * @param specialistId - The specialist ID (beauty_page_specialists.id)
 * @returns Rating stats or null values if no reviews
 */
export async function getSpecialistRatingStats(
  specialistId: string,
): Promise<RatingStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_specialist_rating_stats", {
    spec_id: specialistId,
  });

  if (error || !data || data.length === 0) {
    return {
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const stats = data[0];

  return {
    average_rating: stats.average_rating ?? 0,
    total_reviews: stats.total_reviews ?? 0,
    rating_distribution: (stats.rating_distribution as Record<number, number>) ?? {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };
}

/**
 * Fetches rating stats for multiple specialists in a single query.
 * More efficient than calling getSpecialistRatingStats for each specialist.
 *
 * @param specialistIds - Array of specialist IDs
 * @returns Map of specialist ID to rating stats
 */
export async function getBulkSpecialistRatingStats(
  specialistIds: string[],
): Promise<Map<string, RatingStats>> {
  const supabase = await createClient();

  // Use a single query to get all review stats
  const { data, error } = await supabase
    .from("reviews")
    .select("specialist_id, rating")
    .in("specialist_id", specialistIds);

  const statsMap = new Map<string, RatingStats>();

  // Initialize all specialists with zero stats
  for (const id of specialistIds) {
    statsMap.set(id, {
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }

  if (error || !data) {
    return statsMap;
  }

  // Group reviews by specialist
  const reviewsBySpecialist = new Map<string, number[]>();
  for (const review of data) {
    const reviews = reviewsBySpecialist.get(review.specialist_id) ?? [];
    reviews.push(review.rating);
    reviewsBySpecialist.set(review.specialist_id, reviews);
  }

  // Calculate stats for each specialist
  for (const [specialistId, ratings] of reviewsBySpecialist) {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const rating of ratings) {
      distribution[rating] = (distribution[rating] ?? 0) + 1;
      sum += rating;
    }

    statsMap.set(specialistId, {
      average_rating: ratings.length > 0 ? sum / ratings.length : 0,
      total_reviews: ratings.length,
      rating_distribution: distribution,
    });
  }

  return statsMap;
}
