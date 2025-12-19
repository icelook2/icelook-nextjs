import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSpecialistAppointments } from "./_actions/specialist-appointments.action";
import { SpecialistAppointmentsList } from "./_components/specialist-appointments-list";

interface SpecialistAppointmentsPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function SpecialistAppointmentsPage({
  params,
}: SpecialistAppointmentsPageProps) {
  const { username: rawUsername } = await params;
  const t = await getTranslations("specialist.settings.appointments");

  // Strip @ prefix if present
  const username = rawUsername.startsWith("@")
    ? rawUsername.slice(1)
    : rawUsername;

  // Check authentication
  const profile = await getProfile();
  if (!profile) {
    redirect("/auth");
  }

  const supabase = await createClient();

  // Get the specialist
  const { data: specialist, error } = await supabase
    .from("specialists")
    .select("id, username, user_id")
    .eq("username", username)
    .single();

  if (error || !specialist) {
    notFound();
  }

  // Verify ownership
  if (specialist.user_id !== profile.id) {
    notFound();
  }

  // Fetch appointments
  const result = await getSpecialistAppointments({
    specialistId: specialist.id,
  });

  const appointments = result.success
    ? result.data
    : { upcoming: [], past: [] };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-foreground/60">{t("description")}</p>
      </div>

      <SpecialistAppointmentsList
        upcoming={appointments?.upcoming ?? []}
        past={appointments?.past ?? []}
        specialistUsername={username}
      />
    </div>
  );
}
