import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "./_components/profile-settings-form";

interface ProfileSettingsPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfileSettingsPage({
  params,
}: ProfileSettingsPageProps) {
  const { username: rawUsername } = await params;

  // Strip @ prefix if present
  const username = rawUsername.startsWith("@")
    ? rawUsername.slice(1)
    : rawUsername;

  const profile = await getProfile();
  if (!profile) {
    notFound();
  }

  const supabase = await createClient();

  const { data: specialist, error } = await supabase
    .from("specialists")
    .select("id, username, display_name, bio, specialty, is_active")
    .eq("username", username)
    .eq("user_id", profile.id)
    .single();

  if (error || !specialist) {
    notFound();
  }

  return (
    <ProfileSettingsForm
      specialistId={specialist.id}
      initialData={{
        displayName: specialist.display_name,
        bio: specialist.bio || "",
        specialty: specialist.specialty,
        username: specialist.username,
        isActive: specialist.is_active,
      }}
    />
  );
}
