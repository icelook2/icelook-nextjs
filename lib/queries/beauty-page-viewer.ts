/**
 * Query for fetching beauty page data with ban checking.
 *
 * Uses the get_beauty_page_for_viewer RPC function which:
 * 1. Checks if the viewer is banned (returns null if banned)
 * 2. Returns all beauty page data in a single roundtrip
 * 3. Reduces database queries from 8 to 1
 */

import { createClient } from "@/lib/supabase/server";
import type {
  BeautyPageInfo,
  BeautyPageProfile,
  BeautyPageRatingStats,
  ProfileService,
  ProfileServiceGroup,
  ProfileSpecialist,
  WorkingDayForStatus,
} from "./beauty-page-profile";

// ============================================================================
// Types for RPC Response
// ============================================================================

/** Raw response from get_beauty_page_for_viewer RPC */
type RpcBeautyPageResponse = {
  banned: boolean;
  info?: {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    logo_url: string | null;
    description: string | null;
    is_active: boolean;
    is_verified: boolean;
    creator_display_name: string | null;
    creator_avatar_url: string | null;
    creator_bio: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country_code: string | null;
    phone: string | null;
    email: string | null;
    website_url: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    type: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  timezone?: string;
  workingDays?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  serviceGroups?: Array<{
    id: string;
    name: string;
    display_order: number;
    services: Array<{
      id: string;
      name: string;
      description: string | null;
      display_order: number;
      price_cents: number;
      duration_minutes: number;
      available_from_time: string | null;
      available_to_time: string | null;
    }>;
  }>;
  ratingStats?: {
    averageRating: number;
    totalReviews: number;
  };
};

/** Result of fetching beauty page for viewer */
export type BeautyPageForViewerResult =
  | { type: "success"; profile: BeautyPageProfile }
  | { type: "banned" }
  | { type: "not_found" };

// ============================================================================
// Query Function
// ============================================================================

/**
 * Fetches beauty page data for a specific viewer.
 *
 * This is the primary function for loading beauty pages. It:
 * - Returns "banned" if the viewer is blocked from this beauty page
 * - Returns "not_found" if the page doesn't exist or is inactive
 * - Returns the full profile data otherwise
 *
 * @param nickname - The beauty page slug/nickname
 * @param viewerId - Optional user ID of the viewer (null for guests)
 * @returns Result indicating success, banned, or not found
 */
export async function getBeautyPageForViewer(
  nickname: string,
  viewerId: string | null,
): Promise<BeautyPageForViewerResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_beauty_page_for_viewer", {
    p_nickname: nickname,
    p_viewer_id: viewerId,
  });

  if (error) {
    console.error("Error fetching beauty page for viewer:", error);
    return { type: "not_found" };
  }

  // RPC returns null if page not found or inactive
  if (!data) {
    return { type: "not_found" };
  }

  const response = data as RpcBeautyPageResponse;

  // Check if user is banned
  if (response.banned === true && !response.info) {
    return { type: "banned" };
  }

  // Transform RPC response to BeautyPageProfile
  const profile = transformRpcResponse(response);

  return { type: "success", profile };
}

/**
 * Checks if a user is banned from a beauty page.
 * Lightweight function for quick ban checks.
 *
 * @param beautyPageId - The beauty page ID
 * @param userId - The user ID to check
 * @returns true if banned, false otherwise
 */
export async function isUserBannedFromBeautyPage(
  beautyPageId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "is_user_banned_from_beauty_page",
    {
      p_beauty_page_id: beautyPageId,
      p_user_id: userId,
    },
  );

  if (error) {
    console.error("Error checking ban status:", error);
    return false;
  }

  return data === true;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transforms RPC response to BeautyPageProfile format.
 * Maintains compatibility with existing components.
 */
function transformRpcResponse(response: RpcBeautyPageResponse): BeautyPageProfile {
  const info = response.info!;

  // Transform info to BeautyPageInfo
  const beautyPageInfo: BeautyPageInfo = {
    id: info.id,
    name: info.name,
    slug: info.slug,
    owner_id: info.owner_id,
    logo_url: info.logo_url,
    description: info.description,
    is_active: info.is_active,
    is_verified: info.is_verified,
    type: info.type,
    creator_display_name: info.creator_display_name,
    creator_avatar_url: info.creator_avatar_url,
    creator_bio: info.creator_bio,
    address: info.address,
    city: info.city,
    postal_code: info.postal_code,
    country_code: info.country_code,
    phone: info.phone,
    email: info.email,
    website_url: info.website_url,
    instagram_url: info.instagram_url,
    facebook_url: info.facebook_url,
  };

  // Transform working days
  const workingDays: WorkingDayForStatus[] = (response.workingDays ?? []).map(
    (wd) => ({
      date: wd.date,
      startTime: wd.startTime,
      endTime: wd.endTime,
    }),
  );

  // Transform service groups - filter out empty groups
  const serviceGroups: ProfileServiceGroup[] = (response.serviceGroups ?? [])
    .map((group) => ({
      id: group.id,
      name: group.name,
      display_order: group.display_order,
      services: (group.services ?? []).map(
        (service): ProfileService => ({
          id: service.id,
          name: service.name,
          description: service.description,
          display_order: service.display_order,
          price_cents: service.price_cents,
          duration_minutes: service.duration_minutes,
          available_from_time: service.available_from_time,
          available_to_time: service.available_to_time,
        }),
      ),
    }))
    .filter((group) => group.services.length > 0);

  // Create specialist entry (solo creator model)
  const specialists: ProfileSpecialist[] = [
    {
      id: info.id,
      display_name: info.creator_display_name ?? info.name,
      avatar_url: info.creator_avatar_url ?? info.logo_url,
      bio: info.creator_bio,
    },
  ];

  // Rating stats
  const ratingStats: BeautyPageRatingStats = {
    averageRating: response.ratingStats?.averageRating ?? 0,
    totalReviews: response.ratingStats?.totalReviews ?? 0,
  };

  return {
    info: beautyPageInfo,
    workingDays,
    timezone: response.timezone ?? "Europe/Kyiv",
    serviceGroups,
    specialists,
    ratingStats,
  };
}
