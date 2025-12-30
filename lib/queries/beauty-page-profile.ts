/**
 * Query for fetching all data needed for the public beauty page profile.
 *
 * This is an optimized query that fetches beauty page info, contact details,
 * business hours, service groups with services, and specialists in one call.
 */

import { createClient } from "@/lib/supabase/server";
import { getBulkSpecialistLabels, type SpecialistLabel } from "./labels";
import { getBulkSpecialistRatingStats } from "./reviews";

// ============================================================================
// Types
// ============================================================================

/** Contact information fields added to beauty_pages */
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
} & ContactInfo;

/** Business hours for a single day */
export type DayHours = {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

/** Specialist assignment with price and duration */
export type SpecialistAssignment = {
  id: string;
  member_id: string;
  price_cents: number;
  duration_minutes: number;
  specialist: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
};

/** Service with all specialist assignments */
export type ProfileService = {
  id: string;
  name: string;
  display_order: number;
  assignments: SpecialistAssignment[];
};

/** Service group with its services */
export type ProfileServiceGroup = {
  id: string;
  name: string;
  display_order: number;
  services: ProfileService[];
};

/** Label for display on specialist profile */
export type ProfileSpecialistLabel = Pick<
  SpecialistLabel,
  "id" | "name" | "color"
>;

/** Specialist profile for display */
export type ProfileSpecialist = {
  id: string;
  member_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  full_name: string | null;
  service_count: number;
  /** Average rating (1-5), 0 if no reviews */
  average_rating: number;
  /** Total number of reviews */
  total_reviews: number;
  /** Labels assigned to this specialist */
  labels: ProfileSpecialistLabel[];
};

/** Complete beauty page profile data */
export type BeautyPageProfile = {
  info: BeautyPageInfo;
  businessHours: DayHours[];
  timezone: string;
  serviceGroups: ProfileServiceGroup[];
  specialists: ProfileSpecialist[];
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

  // 1. Fetch beauty page with type and contact info
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

  // 2. Fetch business hours
  const { data: businessHoursData } = await supabase
    .from("beauty_page_business_hours")
    .select("day_of_week, is_open, open_time, close_time, timezone")
    .eq("beauty_page_id", beautyPageId)
    .order("day_of_week", { ascending: true });

  // Extract timezone from first record (all records have same timezone)
  const timezone = businessHoursData?.[0]?.timezone ?? "Europe/Kyiv";

  // 3. Fetch service groups with services and assignments
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
        specialist_service_assignments (
          id,
          member_id,
          price_cents,
          duration_minutes,
          beauty_page_members (
            id,
            beauty_page_specialists (
              id,
              display_name,
              avatar_url
            ),
            profiles (
              full_name
            )
          )
        )
      )
    `)
    .eq("beauty_page_id", beautyPageId)
    .order("display_order", { ascending: true })
    .order("display_order", { referencedTable: "services", ascending: true });

  // 4. Fetch active specialists with service counts
  const { data: membersData } = await supabase
    .from("beauty_page_members")
    .select(`
      id,
      beauty_page_specialists (
        id,
        display_name,
        avatar_url,
        bio,
        is_active
      ),
      profiles (
        full_name
      )
    `)
    .eq("beauty_page_id", beautyPageId)
    .contains("roles", ["specialist"]);

  // Get service counts for each specialist
  const { data: assignmentCounts } = await supabase
    .from("specialist_service_assignments")
    .select("member_id")
    .in(
      "member_id",
      (membersData ?? []).map((m) => m.id),
    );

  const serviceCountByMember = new Map<string, number>();
  for (const assignment of assignmentCounts ?? []) {
    const count = serviceCountByMember.get(assignment.member_id) ?? 0;
    serviceCountByMember.set(assignment.member_id, count + 1);
  }

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

  // Transform business hours
  const businessHours: DayHours[] = (businessHoursData ?? []).map((h) => ({
    day_of_week: h.day_of_week,
    is_open: h.is_open,
    open_time: h.open_time,
    close_time: h.close_time,
  }));

  // Transform service groups
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
          specialist_service_assignments: Array<{
            id: string;
            member_id: string;
            price_cents: number;
            duration_minutes: number;
            beauty_page_members: {
              id: string;
              // Can be array or single object depending on Supabase relationship detection
              beauty_page_specialists:
                | Array<{
                    id: string;
                    display_name: string | null;
                    avatar_url: string | null;
                  }>
                | {
                    id: string;
                    display_name: string | null;
                    avatar_url: string | null;
                  }
                | null;
              profiles: {
                full_name: string | null;
              } | null;
            };
          }>;
        }>) ?? []
      ).map((service) => ({
        id: service.id,
        name: service.name,
        display_order: service.display_order,
        assignments: (service.specialist_service_assignments ?? []).map(
          (assignment) => {
            // Handle both array (one-to-many) and object (one-to-one) return types
            const specialistsData =
              assignment.beauty_page_members?.beauty_page_specialists;
            const specialistProfile = Array.isArray(specialistsData)
              ? specialistsData[0]
              : specialistsData;
            const profile = assignment.beauty_page_members?.profiles;

            // Debug: Log if specialist profile is missing
            if (!specialistProfile) {
              console.warn(
                "[beauty-page-profile] Missing specialist profile for member_id:",
                assignment.member_id,
                "beauty_page_members:",
                JSON.stringify(assignment.beauty_page_members, null, 2),
              );
            }

            return {
              id: assignment.id,
              member_id: assignment.member_id,
              price_cents: assignment.price_cents,
              duration_minutes: assignment.duration_minutes,
              specialist: {
                id: specialistProfile?.id ?? assignment.member_id,
                display_name: specialistProfile?.display_name ?? null,
                avatar_url: specialistProfile?.avatar_url ?? null,
                full_name: profile?.full_name ?? null,
              },
            };
          },
        ),
      })),
    }),
  );

  // Filter active specialists and extract their IDs for rating lookup
  const activeMembers = (membersData ?? []).filter((member) => {
    const specialistProfile = member.beauty_page_specialists as unknown as {
      is_active: boolean;
    } | null;
    return specialistProfile?.is_active !== false;
  });

  // Get specialist IDs for bulk rating stats fetch
  const specialistIds = activeMembers
    .map((member) => {
      const specialistProfile = member.beauty_page_specialists as unknown as {
        id: string;
      } | null;
      return specialistProfile?.id;
    })
    .filter((id): id is string => id !== undefined);

  // Fetch rating stats and labels for all specialists in parallel
  const [ratingStatsMap, labelsMap] = await Promise.all([
    getBulkSpecialistRatingStats(specialistIds),
    getBulkSpecialistLabels(specialistIds),
  ]);

  // Transform specialists with rating data and labels
  const specialists: ProfileSpecialist[] = activeMembers.map((member) => {
    const specialistProfile = member.beauty_page_specialists as unknown as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      is_active: boolean;
    } | null;
    const profile = member.profiles as unknown as {
      full_name: string | null;
    } | null;

    const specialistId = specialistProfile?.id ?? member.id;
    const ratingStats = ratingStatsMap.get(specialistId);
    const specialistLabels = labelsMap.get(specialistId) ?? [];

    return {
      id: specialistId,
      member_id: member.id,
      display_name: specialistProfile?.display_name ?? null,
      avatar_url: specialistProfile?.avatar_url ?? null,
      bio: specialistProfile?.bio ?? null,
      is_active: specialistProfile?.is_active ?? true,
      full_name: profile?.full_name ?? null,
      service_count: serviceCountByMember.get(member.id) ?? 0,
      average_rating: ratingStats?.average_rating ?? 0,
      total_reviews: ratingStats?.total_reviews ?? 0,
      labels: specialistLabels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })),
    };
  });

  return {
    info,
    businessHours,
    timezone,
    serviceGroups,
    specialists,
  };
}
