import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./_components/settings-form";
import { SpecialistSection } from "./_components/specialist-section";
import { BusinessSection } from "./_components/business-section";

export default async function SettingsPage() {
  const profile = await getProfile();
  const t = await getTranslations("settings");

  // Check if user has a specialist profile and businesses
  let specialist = null;
  let businesses: { type: "salon" | "organization"; slug: string; name: string; isActive: boolean }[] = [];

  if (profile) {
    const supabase = await createClient();

    // Fetch specialist profile
    const { data: specialistData } = await supabase
      .from("specialists")
      .select("username, display_name, is_active")
      .eq("user_id", profile.id)
      .single();

    if (specialistData) {
      specialist = {
        username: specialistData.username,
        displayName: specialistData.display_name,
        isActive: specialistData.is_active,
      };
    }

    // Fetch user's businesses (salons and organizations they own)
    const { data: ownerships } = await supabase
      .from("business_owners")
      .select(`
        salon:salons (slug, name, is_active),
        organization:organizations (slug, name, is_active)
      `)
      .eq("user_id", profile.id);

    if (ownerships) {
      for (const ownership of ownerships) {
        // Supabase returns relationships as arrays or objects depending on the FK setup
        const salonData = Array.isArray(ownership.salon)
          ? ownership.salon[0]
          : ownership.salon;
        const orgData = Array.isArray(ownership.organization)
          ? ownership.organization[0]
          : ownership.organization;

        if (salonData) {
          const salon = salonData as { slug: string; name: string; is_active: boolean };
          businesses.push({
            type: "salon",
            slug: salon.slug,
            name: salon.name,
            isActive: salon.is_active,
          });
        }
        if (orgData) {
          const org = orgData as { slug: string; name: string; is_active: boolean };
          businesses.push({
            type: "organization",
            slug: org.slug,
            name: org.name,
            isActive: org.is_active,
          });
        }
      }
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-foreground/60">{t("subtitle")}</p>
        </div>

        <SettingsForm
          initialName={profile?.full_name ?? ""}
          initialEmail={profile?.email ?? ""}
        />

        <SpecialistSection specialist={specialist} />

        <BusinessSection businesses={businesses} />
      </div>
    </div>
  );
}
