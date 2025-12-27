import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

type BeautyPageMember = {
  id: string;
  beauty_page_id: string;
  user_id: string;
  roles: ("admin" | "specialist")[];
  created_at: string;
  updated_at: string;
};

export type Invitation = {
  id: string;
  beauty_page_id: string;
  email: string;
  roles: ("admin" | "specialist")[];
  invited_by: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
};

export type TeamMember = BeautyPageMember & {
  profiles: Pick<
    ProfileRow,
    "id" | "full_name" | "email" | "avatar_url"
  > | null;
};

export type InvitationWithInviter = Invitation & {
  invited_by_profile: Pick<ProfileRow, "id" | "full_name"> | null;
};

export type InvitationWithBeautyPage = Invitation & {
  beauty_pages: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  invited_by_profile: Pick<ProfileRow, "id" | "full_name"> | null;
};

/**
 * Fetches all team members for a beauty page
 */
export async function getBeautyPageTeam(
  beautyPageId: string,
): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_members")
    .select("*, profiles (id, full_name, email, avatar_url)")
    .eq("beauty_page_id", beautyPageId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Fetches all pending invitations for a beauty page
 */
export async function getBeautyPageInvitations(
  beautyPageId: string,
): Promise<InvitationWithInviter[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select(
      "*, invited_by_profile:profiles!invitations_invited_by_fkey(id, full_name)",
    )
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Fetches all pending invitations for the current user (by email)
 */
export async function getUserPendingInvitations(
  userEmail: string,
): Promise<InvitationWithBeautyPage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select(`
      *,
      beauty_pages (id, name, slug, logo_url),
      invited_by_profile:profiles!invitations_invited_by_fkey(id, full_name)
    `)
    .eq("email", userEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user invitations:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Checks if an email already has a pending invitation for a beauty page
 */
export async function hasPendingInvitation(
  beautyPageId: string,
  email: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("id")
    .eq("beauty_page_id", beautyPageId)
    .eq("email", email)
    .eq("status", "pending")
    .single();

  if (error) {
    return false;
  }

  return data !== null;
}

/**
 * Checks if an email is already a member of a beauty page
 */
export async function isMemberByEmail(
  beautyPageId: string,
  email: string,
): Promise<boolean> {
  const supabase = await createClient();

  // First find the user by email
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    return false;
  }

  // Then check if they're a member
  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("id")
    .eq("beauty_page_id", beautyPageId)
    .eq("user_id", profile.id)
    .single();

  return member !== null;
}
