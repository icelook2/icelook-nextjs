import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SettingsNav } from "./_components/settings-nav";

interface SpecialistSettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    username: string;
  }>;
}

export default async function SpecialistSettingsLayout({
  children,
  params,
}: SpecialistSettingsLayoutProps) {
  const { username: rawUsername } = await params;
  const t = await getTranslations("specialist.settings");

  // Strip @ prefix if present
  const username = rawUsername.startsWith("@")
    ? rawUsername.slice(1)
    : rawUsername;

  // Check if user is authenticated
  const profile = await getProfile();
  if (!profile) {
    redirect("/auth");
  }

  const supabase = await createClient();

  // Verify the specialist exists and belongs to the current user
  const { data: specialist, error } = await supabase
    .from("specialists")
    .select("id, username, user_id")
    .eq("username", username)
    .single();

  if (error || !specialist) {
    notFound();
  }

  // Only the owner can access settings
  if (specialist.user_id !== profile.id) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-foreground/60">{t("subtitle")}</p>
        </div>

        <SettingsNav username={username} />

        {children}
      </div>
    </div>
  );
}
