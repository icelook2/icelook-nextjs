import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getClientAppointments } from "./_actions/appointments.action";
import { AppointmentsList } from "./_components/appointments-list";

export default async function AppointmentsPage() {
  const t = await getTranslations("appointments");
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch appointments
  const result = await getClientAppointments();

  const appointments = result.success
    ? result.data
    : { upcoming: [], past: [] };

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-foreground/60 mt-1">{t("subtitle")}</p>
        </div>

        {/* Appointments */}
        <AppointmentsList
          upcoming={appointments?.upcoming ?? []}
          past={appointments?.past ?? []}
        />
      </div>
    </div>
  );
}
