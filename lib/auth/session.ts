import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VisitPreferences } from "@/lib/types";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  preferred_locale: string | null;
  visit_preferences: VisitPreferences | null;
  created_at: string;
  updated_at: string;
};

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth(redirectTo = "/auth") {
  const user = await getUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export function isOnboardingComplete(profile: Profile | null): boolean {
  return profile?.full_name != null && profile.full_name.trim() !== "";
}
