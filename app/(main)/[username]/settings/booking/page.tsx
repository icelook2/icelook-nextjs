import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getBookingSettings } from "./_actions/booking-settings.action";
import { BookingSettingsForm } from "./_components/booking-settings-form";

interface BookingSettingsPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function BookingSettingsPage({
  params,
}: BookingSettingsPageProps) {
  const { username: rawUsername } = await params;
  const t = await getTranslations("specialist.settings.booking_settings");

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

  // Fetch booking settings
  const result = await getBookingSettings({
    specialistId: specialist.id,
  });

  const defaultSettings = {
    specialist_id: specialist.id,
    auto_confirm: false,
    min_booking_notice_hours: 2,
    max_booking_days_ahead: 30,
    allow_client_cancellation: true,
    cancellation_notice_hours: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const settings =
    result.success && result.data ? result.data : defaultSettings;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-foreground/60">{t("description")}</p>
      </div>

      <BookingSettingsForm
        specialistId={specialist.id}
        initialSettings={settings}
      />
    </div>
  );
}
