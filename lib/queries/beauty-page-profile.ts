/**
 * Query for fetching all data needed for the public beauty page profile.
 *
 * This is an optimized query that fetches beauty page info, contact details,
 * business hours, and service groups with services in one call.
 *
 * Solo Creator Model: Each beauty page has ONE creator who provides all services.
 * Prices and durations are stored directly on services (no specialist assignments).
 */

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

/** Contact information fields on beauty_pages */
export type ContactInfo = {
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
};

/** Creator profile fields on beauty_pages */
export type CreatorProfile = {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

/** Beauty page type (category) for profile display */
export type ProfileBeautyPageType = {
  id: string;
  name: string;
  slug: string;
};

/** Core beauty page data for profile display */
export type BeautyPageInfo = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  is_verified: boolean;
  type: ProfileBeautyPageType | null;
  /** Creator's display name for bookings */
  creator_display_name: string | null;
  /** Creator's avatar for display */
  creator_avatar_url: string | null;
  /** Creator's bio */
  creator_bio: string | null;
} & ContactInfo;

/** Working day for status calculation */
export type WorkingDayForStatus = {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM or HH:MM:SS
  endTime: string; // HH:MM or HH:MM:SS
};

/** Service with price and duration (solo creator model) */
export type ProfileService = {
  id: string;
  name: string;
  display_order: number;
  price_cents: number;
  duration_minutes: number;
};

/** Service group with its services */
export type ProfileServiceGroup = {
  id: string;
  name: string;
  display_order: number;
  services: ProfileService[];
};

/** Specialist profile for display (simplified for solo creator) */
export type ProfileSpecialist = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

/** Rating statistics for the beauty page */
export type BeautyPageRatingStats = {
  averageRating: number;
  totalReviews: number;
};

/** Complete beauty page profile data */
export type BeautyPageProfile = {
  info: BeautyPageInfo;
  /** Upcoming working days for status calculation (sorted by date) */
  workingDays: WorkingDayForStatus[];
  timezone: string;
  serviceGroups: ProfileServiceGroup[];
  /** The creator (solo specialist) for this beauty page */
  specialists: ProfileSpecialist[];
  /** Rating stats from reviews */
  ratingStats: BeautyPageRatingStats;
};

// ============================================================================
// Query Function
// ============================================================================

/**
 * Fetches all data needed for the public beauty page profile.
 *
 * @param nickname - The beauty page slug/nickname
 * @returns Complete profile data or null if not found/inactive
 */
export async function getBeautyPageProfile(
  nickname: string,
): Promise<BeautyPageProfile | null> {
  const supabase = await createClient();

  // 1. Fetch beauty page with type, contact info, creator profile, and timezone
  const { data: beautyPage, error: pageError } = await supabase
    .from("beauty_pages")
    .select(`
      id,
      name,
      slug,
      owner_id,
      logo_url,
      description,
      is_active,
      is_verified,
      timezone,
      display_name,
      avatar_url,
      bio,
      address,
      city,
      postal_code,
      country_code,
      phone,
      email,
      website_url,
      instagram_url,
      facebook_url,
      beauty_page_types (id, name, slug)
    `)
    .eq("slug", nickname)
    .eq("is_active", true)
    .single();

  if (pageError || !beautyPage) {
    return null;
  }

  const beautyPageId = beautyPage.id;

  // 2. Fetch upcoming working days (next 30 days for status calculation)
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: workingDaysData } = await supabase
    .from("working_days")
    .select("date, start_time, end_time")
    .eq("beauty_page_id", beautyPageId)
    .gte("date", today)
    .lte("date", futureDate)
    .order("date", { ascending: true });

  // 3. Fetch service groups with services (price and duration are on services now)
  const { data: serviceGroupsData } = await supabase
    .from("service_groups")
    .select(`
      id,
      name,
      display_order,
      services (
        id,
        name,
        display_order,
        price_cents,
        duration_minutes
      )
    `)
    .eq("beauty_page_id", beautyPageId)
    .order("display_order", { ascending: true })
    .order("display_order", { referencedTable: "services", ascending: true });

  // 4. Fetch rating stats from reviews
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("rating")
    .eq("beauty_page_id", beautyPageId);

  // ============================================================================
  // Transform Data
  // ============================================================================

  // Transform beauty page info
  const typeData = beautyPage.beauty_page_types;
  const info: BeautyPageInfo = {
    id: beautyPage.id,
    name: beautyPage.name,
    slug: beautyPage.slug,
    owner_id: beautyPage.owner_id,
    logo_url: beautyPage.logo_url,
    description: beautyPage.description,
    is_active: beautyPage.is_active,
    is_verified: beautyPage.is_verified,
    type: typeData
      ? {
          id: (typeData as unknown as ProfileBeautyPageType).id,
          name: (typeData as unknown as ProfileBeautyPageType).name,
          slug: (typeData as unknown as ProfileBeautyPageType).slug,
        }
      : null,
    // Creator profile
    creator_display_name: beautyPage.display_name,
    creator_avatar_url: beautyPage.avatar_url,
    creator_bio: beautyPage.bio,
    // Contact info
    address: beautyPage.address,
    city: beautyPage.city,
    postal_code: beautyPage.postal_code,
    country_code: beautyPage.country_code,
    phone: beautyPage.phone,
    email: beautyPage.email,
    website_url: beautyPage.website_url,
    instagram_url: beautyPage.instagram_url,
    facebook_url: beautyPage.facebook_url,
  };

  // Get timezone (default to Europe/Kyiv if not set)
  const timezone = beautyPage.timezone ?? "Europe/Kyiv";

  // Transform working days for status calculation
  const workingDays: WorkingDayForStatus[] = (workingDaysData ?? []).map(
    (wd) => ({
      date: wd.date,
      startTime: wd.start_time,
      endTime: wd.end_time,
    }),
  );

  // Transform service groups (services now have price and duration directly)
  const serviceGroups: ProfileServiceGroup[] = (serviceGroupsData ?? []).map(
    (group) => ({
      id: group.id,
      name: group.name,
      display_order: group.display_order,
      services: (
        (group.services as unknown as Array<{
          id: string;
          name: string;
          display_order: number;
          price_cents: number;
          duration_minutes: number;
        }>) ?? []
      ).map((service) => ({
        id: service.id,
        name: service.name,
        display_order: service.display_order,
        price_cents: service.price_cents,
        duration_minutes: service.duration_minutes,
      })),
    }),
  );

  // Create single specialist entry representing the creator
  // This maintains API compatibility while simplifying to solo creator model
  const specialists: ProfileSpecialist[] = [
    {
      id: beautyPage.id, // Use beauty page ID as specialist ID
      display_name: beautyPage.display_name ?? beautyPage.name,
      avatar_url: beautyPage.avatar_url ?? beautyPage.logo_url,
      bio: beautyPage.bio,
    },
  ];

  // Calculate rating stats
  const reviews = reviewsData ?? [];
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const ratingStats: BeautyPageRatingStats = {
    averageRating,
    totalReviews,
  };

  return {
    info,
    workingDays,
    timezone,
    serviceGroups,
    specialists,
    ratingStats,
  };
}
