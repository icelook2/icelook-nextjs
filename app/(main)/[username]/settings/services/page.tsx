import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ServicesSettingsForm } from "./_components/services-settings-form";

interface ServicesSettingsPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ServicesSettingsPage({
  params,
}: ServicesSettingsPageProps) {
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
    .select(
      `
      id,
      username,
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
      )
    `,
    )
    .eq("username", username)
    .eq("user_id", profile.id)
    .single();

  if (error || !specialist) {
    notFound();
  }

  // Transform data for the form
  const serviceGroups = (specialist.service_groups || []).map((group) => ({
    id: group.id,
    name: group.name,
    isDefault: group.is_default,
    services: (group.services || []).map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      currency: service.currency as "UAH" | "USD" | "EUR",
      durationMinutes: service.duration_minutes,
      isActive: service.is_active,
    })),
  }));

  return (
    <ServicesSettingsForm
      specialistId={specialist.id}
      username={specialist.username}
      initialGroups={serviceGroups}
    />
  );
}
