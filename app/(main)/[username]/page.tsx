import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BookingSpecialist } from "@/lib/appointments";
import { ProfileHeader } from "./_components/profile-header";
import { ServicesSection } from "./_components/services-section";
import { ContactsSection } from "./_components/contacts-section";

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username: rawUsername } = await params;

  // Strip @ prefix if present (from URL like /@username)
  const username = rawUsername.startsWith("@")
    ? rawUsername.slice(1)
    : rawUsername;

  // Reserved usernames that shouldn't be treated as specialist profiles
  const reservedUsernames = ["settings", "auth", "onboarding", "api"];
  if (reservedUsernames.includes(username.toLowerCase())) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch specialist with contacts and service groups
  const { data: specialist, error } = await supabase
    .from("specialists")
    .select(
      `
      id,
      user_id,
      username,
      display_name,
      bio,
      specialty,
      is_active,
      specialist_contacts (
        instagram,
        phone,
        telegram,
        viber,
        whatsapp
      ),
      service_groups (
        id,
        name,
        is_default,
        services (
          id,
          name,
          price,
          currency,
          duration_minutes,
          is_active
        )
      ),
      specialist_schedule_config (
        timezone
      )
    `,
    )
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (error || !specialist) {
    notFound();
  }

  // Get current user for auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's name if authenticated
  let userName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    userName = profile?.full_name || user.email || null;
  }

  // Filter active services and format data
  const serviceGroups = (specialist.service_groups || []).map((group) => ({
    id: group.id,
    name: group.name,
    services: (group.services || []).filter((s) => s.is_active),
  }));

  const contacts = specialist.specialist_contacts?.[0] || null;
  const timezone =
    specialist.specialist_schedule_config?.[0]?.timezone ?? "Europe/Kyiv";

  // Prepare specialist data for booking
  const bookingSpecialist: BookingSpecialist = {
    id: specialist.id,
    username: specialist.username,
    display_name: specialist.display_name,
    timezone,
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <ProfileHeader
          displayName={specialist.display_name}
          username={specialist.username}
          bio={specialist.bio}
          specialty={specialist.specialty}
          isOwner={user?.id === specialist.user_id}
        />

        <ServicesSection
          serviceGroups={serviceGroups}
          specialist={bookingSpecialist}
          isAuthenticated={!!user}
          userName={userName}
        />

        <ContactsSection contacts={contacts} />
      </div>
    </div>
  );
}
