import { createClient } from "@/lib/supabase/server";

// Note: These types will be properly defined after regenerating database.types.ts
// For now, we define them inline based on the migration schema

export type SpecialistProfile = {
 id: string;
 member_id: string;
 display_name: string | null;
 avatar_url: string | null;
 bio: string | null;
 is_active: boolean;
 created_at: string;
};

type ProfileRow = {
 id: string;
 full_name: string | null;
 email: string;
 avatar_url: string | null;
};

type BeautyPageMemberRow = {
 id: string;
 beauty_page_id: string;
 user_id: string;
 roles: ("admin" | "specialist")[];
 created_at: string;
 updated_at: string;
};

type ServiceRow = {
 id: string;
 service_group_id: string;
 name: string;
 description?: string | null;
 duration_minutes: number;
 display_order: number;
 created_at: string;
 updated_at: string;
};

type ServiceGroupRow = {
 id: string;
 beauty_page_id: string;
 name: string;
 description?: string | null;
 display_order: number;
 created_at: string;
 updated_at: string;
};

export type SpecialistWithMember = SpecialistProfile & {
 beauty_page_members: BeautyPageMemberRow & {
 profiles: Pick<
 ProfileRow,
 "id" | "full_name" | "email" | "avatar_url"
 > | null;
 };
};

export type SpecialistServiceAssignmentWithService = {
 id: string;
 member_id: string;
 service_id: string;
 price_cents: number;
 duration_minutes: number;
 created_at: string;
 services: ServiceRow & {
 service_groups: Pick<ServiceGroupRow, "id" | "name">;
 };
};

export type SpecialistWithAssignments = SpecialistWithMember & {
 specialist_service_assignments: SpecialistServiceAssignmentWithService[];
};

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
 .from("beauty_page_specialist_profiles")
 .select("*")
 .in("member_id", memberIds);

 if (profilesError) {
 console.error("Error fetching specialist profiles:", {
 message: profilesError.message,
 code: profilesError.code,
 });
 return [];
 }

 // Combine the data
 return (profiles ?? []).map((profile) => {
 const member = members.find((m) => m.id === profile.member_id);
 return {
 ...profile,
 beauty_page_members: member!,
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
 .from("beauty_page_specialist_profiles")
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

 // Get service assignments - the table uses member_id, not specialist_profile_id
 const { data: assignments, error: assignmentsError } = await supabase
 .from("specialist_service_assignments")
 .select("*, services (*, service_groups (id, name))")
 .eq("member_id", profile.member_id);

 if (assignmentsError) {
 console.error("Error fetching assignments:", {
 message: assignmentsError.message,
 code: assignmentsError.code,
 details: assignmentsError.details,
 hint: assignmentsError.hint,
 status: (assignmentsError as unknown as { status?: number }).status,
 fullError: JSON.stringify(assignmentsError),
 });
 }

 return {
 ...profile,
 beauty_page_members: member,
 specialist_service_assignments: assignments ?? [],
 } as SpecialistWithAssignments;
}

/**
 * Fetches members who are admins but not specialists (for "make specialist" feature)
 */
export async function getNonSpecialistAdmins(beautyPageId: string): Promise<
 Array<
 BeautyPageMemberRow & {
 profiles: Pick<
 ProfileRow,
 "id" | "full_name" | "email" | "avatar_url"
 > | null;
 }
 >
> {
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

 return data ?? [];
}

/**
 * Gets the count of service assignments for a specialist
 */
export async function getSpecialistAssignmentCount(
 specialistProfileId: string,
): Promise<number> {
 const supabase = await createClient();

 const { count, error } = await supabase
 .from("specialist_service_assignments")
 .select("*", { count: "exact", head: true })
 .eq("specialist_profile_id", specialistProfileId);

 if (error) {
 console.error("Error counting specialist assignments:", error);
 return 0;
 }

 return count ?? 0;
}

/**
 * Checks if a specialist profile exists for a member
 */
export async function hasSpecialistProfile(memberId: string): Promise<boolean> {
 const supabase = await createClient();

 const { data, error } = await supabase
 .from("beauty_page_specialist_profiles")
 .select("id")
 .eq("member_id", memberId)
 .maybeSingle();

 if (error) {
 console.error("Error checking specialist profile:", error);
 return false;
 }

 return data !== null;
}
