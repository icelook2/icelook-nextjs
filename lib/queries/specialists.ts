import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getBulkSpecialistLabels, type SpecialistLabel } from "./labels";

// ============================================================================
// Types derived from Supabase generated types
// ============================================================================

export type SpecialistProfile = Tables<"beauty_page_specialists">;

type Profile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "avatar_url"
>;

export type BeautyPageMember = Tables<"beauty_page_members"> & {
  profiles: Profile | null;
};

type Service = Tables<"services"> & {
  service_groups: Pick<Tables<"service_groups">, "id" | "name">;
};

export type ServiceAssignment = Tables<"specialist_service_assignments"> & {
  services: Service;
};

// Re-export for backwards compatibility
export type SpecialistServiceAssignmentWithService = ServiceAssignment;

/** Label for display on specialist list */
export type SpecialistListLabel = Pick<SpecialistLabel, "id" | "name" | "color">;

export type SpecialistWithMember = SpecialistProfile & {
  beauty_page_members: BeautyPageMember;
  labels: SpecialistListLabel[];
};

export type SpecialistWithAssignments = SpecialistWithMember & {
  specialist_service_assignments: ServiceAssignment[];
};

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetches all specialist profiles for a beauty page
 */
export async function getBeautyPageSpecialistProfiles(
  beautyPageId: string,
): Promise<SpecialistWithMember[]> {
  const supabase = await createClient();

  // First get members who are specialists for this beauty page
  const { data: members, error: membersError } = await supabase
    .from("beauty_page_members")
    .select("*, profiles (id, full_name, email, avatar_url)")
    .eq("beauty_page_id", beautyPageId)
    .contains("roles", ["specialist"])
    .order("created_at", { ascending: true });

  if (membersError) {
    console.error("Error fetching specialist members:", {
      message: membersError.message,
      code: membersError.code,
      beautyPageId,
    });
    return [];
  }

  if (!members || members.length === 0) {
    return [];
  }

  // Get specialist profiles for these members
  const memberIds = members.map((m) => m.id);
  const { data: profiles, error: profilesError } = await supabase
    .from("beauty_page_specialists")
    .select("*")
    .in("member_id", memberIds);

  if (profilesError) {
    console.error("Error fetching specialist profiles:", {
      message: profilesError.message,
      code: profilesError.code,
    });
    return [];
  }

  // Fetch labels for all specialists
  const specialistIds = (profiles ?? []).map((p) => p.id);
  const labelsMap = await getBulkSpecialistLabels(specialistIds);

  // Combine the data
  return (profiles ?? []).map((profile) => {
    const member = members.find((m) => m.id === profile.member_id);
    const labels = labelsMap.get(profile.id) ?? [];
    return {
      ...profile,
      beauty_page_members: member!,
      labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
    };
  }) as SpecialistWithMember[];
}

/**
 * Fetches a single specialist profile with all details including service assignments
 */
export async function getSpecialistProfileById(
  profileId: string,
): Promise<SpecialistWithAssignments | null> {
  const supabase = await createClient();

  // First, get the basic specialist profile
  const { data: profile, error: profileError } = await supabase
    .from("beauty_page_specialists")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching specialist profile:", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
      profileId,
    });
    return null;
  }

  if (!profile) {
    console.error("Specialist profile not found:", profileId);
    return null;
  }

  // Get member with profile data
  const { data: member, error: memberError } = await supabase
    .from("beauty_page_members")
    .select("*, profiles (id, full_name, email, avatar_url)")
    .eq("id", profile.member_id)
    .single();

  if (memberError) {
    console.error("Error fetching member:", {
      message: memberError.message,
      code: memberError.code,
      details: memberError.details,
      hint: memberError.hint,
      memberId: profile.member_id,
    });
    return null;
  }

  // Get service assignments and labels in parallel
  const [assignmentsResult, labelsMap] = await Promise.all([
    supabase
      .from("specialist_service_assignments")
      .select("*, services (*, service_groups (id, name))")
      .eq("member_id", profile.member_id),
    getBulkSpecialistLabels([profileId]),
  ]);

  if (assignmentsResult.error) {
    console.error("Error fetching assignments:", {
      message: assignmentsResult.error.message,
      code: assignmentsResult.error.code,
      details: assignmentsResult.error.details,
      hint: assignmentsResult.error.hint,
    });
  }

  const labels = labelsMap.get(profileId) ?? [];

  return {
    ...profile,
    beauty_page_members: member,
    specialist_service_assignments: assignmentsResult.data ?? [],
    labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
  } as SpecialistWithAssignments;
}

/**
 * Fetches members who are admins but not specialists (for "make specialist" feature)
 */
export async function getNonSpecialistAdmins(
  beautyPageId: string,
): Promise<BeautyPageMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_members")
    .select("*, profiles (id, full_name, email, avatar_url)")
    .eq("beauty_page_id", beautyPageId)
    .contains("roles", ["admin"])
    .not("roles", "cs", '{"specialist"}')
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching non-specialist admins:", error);
    return [];
  }

  return (data ?? []) as BeautyPageMember[];
}

/**
 * Checks if a specialist profile exists for a member
 */
export async function hasSpecialistProfile(memberId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_specialists")
    .select("id")
    .eq("member_id", memberId)
    .maybeSingle();

  if (error) {
    console.error("Error checking specialist profile:", error);
    return false;
  }

  return data !== null;
}
