import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getClientAppointments } from "@/lib/queries/appointments";
import { PageHeader } from "@/lib/ui/page-header";
import { AppointmentsList } from "./_components";

export default async function AppointmentsPage() {
  const t = await getTranslations("appointments");
  const profile = await getProfile();

  if (!profile) {
    redirect("/auth");
  }

  const { upcoming, past } = await getClientAppointments(profile.id);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4 pb-8">
        <AppointmentsList upcoming={upcoming} past={past} />
      </div>
    </>
  );
}
