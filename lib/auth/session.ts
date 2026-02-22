import { redirect } from "next/navigation";
import { getApiSession } from "@/lib/api/auth-server";
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
  const apiSession = await getApiSession();
  return apiSession?.session ?? null;
}

export async function getUser() {
  const apiSession = await getApiSession();
  return apiSession?.user ?? null;
}

export async function requireAuth(redirectTo = "/auth") {
  const user = await getUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    full_name: user.name ?? null,
    avatar_url: user.image ?? null,
    preferred_locale: null,
    visit_preferences: null as VisitPreferences | null,
    created_at: "",
    updated_at: "",
  };
}

export function isOnboardingComplete(profile: Profile | null): boolean {
  return profile?.full_name != null && profile.full_name.trim() !== "";
}
